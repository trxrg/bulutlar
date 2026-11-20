import { BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { generateHTMLDocument, generateMergedHTMLDocument, buildMergedHTMLString, fillTableOfContentsPageNumbers } from './htmlGeneration.js';
import { resolveExportLayout, extractPrimaryFontName } from './exportLayout.js';
import { readArticlePageNumbers, addContentsLinks } from './pdfTableOfContents.js';

const PT_PER_INCH = 72;

// Images are downscaled to this resolution at their printed width.
const IMAGE_TARGET_DPI = 200;
const IMAGE_JPEG_QUALITY = 0.85;

/*
 * Chromium embeds the macOS system font (a variable font) as many bulky Type 3
 * fonts, so for PDF the "System UI" choice is swapped for a bundled sans font,
 * which is embedded once as a compact subset.
 */
const PDF_SYSTEM_FONT_FALLBACK = '"Noto Sans", sans-serif';

function withPdfFont(exportData) {
    const options = exportData.options || {};
    if (extractPrimaryFontName(options.fontFamily)) return exportData;
    return { ...exportData, options: { ...options, fontFamily: PDF_SYSTEM_FONT_FALLBACK } };
}

/** Page size and margins for printToPDF; they match the @page rule of the generated HTML. */
function buildPrintOptions(layout) {
    const m = layout.pageMarginIn;
    return {
        printBackground: true,
        pageSize: layout.electronPageSize,
        margins: { top: m, bottom: m, left: m, right: m },
    };
}

/*
 * Runs in the print window before printing. Article images are embedded at
 * their original resolution (often multi-megabyte photos), and Chromium puts
 * them into the PDF as-is. Redraw each one at the resolution it is printed at
 * and re-encode it: JPEG for opaque images, PNG when there is transparency.
 * Doing this in Chromium keeps EXIF orientation exactly as it is rendered.
 * The original is kept when the re-encoded image would not be smaller.
 */
const OPTIMIZE_IMAGES_SCRIPT = (maxWidthPx, jpegQuality) => `
    (async () => {
        const maxWidthPx = ${Math.round(maxWidthPx)};
        const jpegQuality = ${jpegQuality};
        for (const img of document.querySelectorAll('img.embedded-image')) {
            try {
                if (img.src.startsWith('data:image/svg')) continue;
                await img.decode();
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                if (!w || !h) continue;
                const scale = Math.min(1, maxWidthPx / w);
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(w * scale));
                canvas.height = Math.max(1, Math.round(h * scale));
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                let hasAlpha = false;
                if (!img.src.startsWith('data:image/jpeg')) {
                    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    for (let i = 3; i < pixels.length; i += 4) {
                        if (pixels[i] < 255) { hasAlpha = true; break; }
                    }
                }
                const optimized = hasAlpha
                    ? canvas.toDataURL('image/png')
                    : canvas.toDataURL('image/jpeg', jpegQuality);
                if (optimized.length < img.src.length) {
                    img.src = optimized;
                    await img.decode();
                }
            } catch (_) { /* keep the original image */ }
        }
    })()
`;

/** Load an HTML file in a hidden window and print it to PDF bytes with Electron's Chromium. */
async function renderHtmlToPdfBuffer(tempHtmlPath, layout, printToPDFOverrides = {}) {
    const win = new BrowserWindow({
        show: false,
        width: 1200,
        height: 1600,
        webPreferences: {
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    try {
        // Resolves after the load event, i.e. once the embedded images have loaded.
        await win.loadURL(pathToFileURL(path.resolve(tempHtmlPath)).href);
        // Wait for bundled @font-face files before printing.
        await win.webContents.executeJavaScript(`
            (async () => {
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (_) { /* ignore */ }
                }
            })()
        `, true);
        const maxImageWidthPx = layout.printableWidthIn * IMAGE_TARGET_DPI;
        await win.webContents.executeJavaScript(OPTIMIZE_IMAGES_SCRIPT(maxImageWidthPx, IMAGE_JPEG_QUALITY), true);
        return await win.webContents.printToPDF({ ...buildPrintOptions(layout), ...printToPDFOverrides });
    } finally {
        win.destroy();
    }
}

async function removeTempFile(tempHtmlPath) {
    if (!tempHtmlPath) return;
    try {
        await fs.unlink(tempHtmlPath);
    } catch (cleanupError) {
        console.warn('Could not delete temporary HTML file:', cleanupError);
    }
}

// Generate PDF from HTML using Electron's Chromium (no Puppeteer)
export async function generateHTMLToPDF(exportData, filePath, imagesFolderPath) {
    const tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
    try {
        const pdfExportData = withPdfFont(exportData);
        const layout = resolveExportLayout(pdfExportData.options);
        await generateHTMLDocument(pdfExportData, tempHtmlPath, imagesFolderPath);
        await fs.writeFile(filePath, await renderHtmlToPdfBuffer(tempHtmlPath, layout));
        console.log('PDF generated successfully using HTML-to-PDF conversion');
    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        throw error;
    } finally {
        await removeTempFile(tempHtmlPath);
    }
}

const escapeTemplateText = (text) => String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Page-number footer for printToPDF. The whole footer strip is later turned
 * into a link to the contents (see addContentsLinks), hence the label.
 * Header/footer templates cannot use the document's web fonts; Arial/Helvetica
 * are static system fonts and embed compactly (unlike system-ui on macOS).
 */
function buildPageNumberFooterTemplate(marginCm, contentsLabel) {
    return `
        <div style="width:100%; box-sizing:border-box; padding:0 ${marginCm}cm; display:flex; align-items:center;
                    font-family:Arial, Helvetica, sans-serif; font-size:9px; color:#777;">
            <span style="flex:1"></span>
            <span class="pageNumber" style="flex:0 0 auto"></span>
            <span style="flex:1; text-align:right">&#8593; ${escapeTemplateText(contentsLabel)}</span>
        </div>`;
}

/**
 * Merged PDF with page numbers and a contents section at the end.
 * Pass 1 prints the document to learn on which page each article starts;
 * pass 2 prints it again with those numbers filled in (the contents come
 * last, so filling them in cannot shift the article pages). Finally each
 * page's footer is linked to its article's line in the contents.
 */
async function generateMergedPDFWithContents(exportData, filePath, tempHtmlPath, imagesFolderPath, articleService) {
    const articleCount = exportData.articles.length;
    const layout = resolveExportLayout(exportData.options);
    const footerOptions = {
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: buildPageNumberFooterTemplate(parseFloat(layout.pageMarginCm), exportData.translations?.contents || 'Contents'),
    };

    const html = await buildMergedHTMLString(exportData, imagesFolderPath, articleService, { includeTableOfContents: true });

    await fs.writeFile(tempHtmlPath, html, 'utf8');
    const firstPass = await renderHtmlToPdfBuffer(tempHtmlPath, layout, footerOptions);
    const pageNumbers = await readArticlePageNumbers(firstPass, articleCount);

    await fs.writeFile(tempHtmlPath, fillTableOfContentsPageNumbers(html, pageNumbers), 'utf8');
    const secondPass = await renderHtmlToPdfBuffer(tempHtmlPath, layout, footerOptions);

    let output = secondPass;
    try {
        output = await addContentsLinks(secondPass, articleCount, { footerHeightPt: layout.pageMarginIn * PT_PER_INCH });
    } catch (linkError) {
        console.warn('Could not add contents links to PDF footers:', linkError);
    }
    await fs.writeFile(filePath, output);
}

// Generate merged PDF from multiple articles using Electron's Chromium
export async function generateMergedHTMLToPDF(exportData, filePath, imagesFolderPath, articleService) {
    const tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
    try {
        const pdfExportData = withPdfFont(exportData);
        if (pdfExportData.options?.tableOfContents !== false && pdfExportData.articles?.length > 0) {
            await generateMergedPDFWithContents(pdfExportData, filePath, tempHtmlPath, imagesFolderPath, articleService);
        } else {
            const layout = resolveExportLayout(pdfExportData.options);
            await generateMergedHTMLDocument(pdfExportData, tempHtmlPath, imagesFolderPath, articleService);
            await fs.writeFile(filePath, await renderHtmlToPdfBuffer(tempHtmlPath, layout));
        }
        console.log('Merged PDF generated successfully using HTML-to-PDF conversion');
    } catch (error) {
        console.error('Error generating merged PDF from HTML:', error);
        throw error;
    } finally {
        await removeTempFile(tempHtmlPath);
    }
}
