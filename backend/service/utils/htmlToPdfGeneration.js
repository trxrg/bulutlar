import { BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { generateHTMLDocument, generateMergedHTMLDocument } from './htmlGeneration.js';

const PDF_OPTIONS = {
    printBackground: true,
    scaleFactor: 0.8,
    pageSize: 'A4',
    marginsType: 0, // default margins (Electron doesn't support mm like Puppeteer; use 0=default, 1=none, 2=minimum)
};

/** Load HTML file in a hidden window and print to PDF using Electron's Chromium. */
async function printHtmlToPdf(tempHtmlPath, filePath, options = {}) {
    const timeout = options.timeout || 30000;
    const waitAfterLoad = options.waitAfterLoad || 0;
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
        const fileUrl = pathToFileURL(path.resolve(tempHtmlPath)).href;
        // loadURL resolves when the page finishes loading
        await win.loadURL(fileUrl);
        if (waitAfterLoad > 0) {
            await new Promise((r) => setTimeout(r, waitAfterLoad));
        }
        const data = await win.webContents.printToPDF({ ...PDF_OPTIONS, ...options.printToPDF });
        await fs.writeFile(filePath, data);
    } finally {
        win.destroy();
    }
}

// Generate PDF from HTML using Electron's Chromium (no Puppeteer)
export async function generateHTMLToPDF(exportData, filePath, imagesFolderPath) {
    let tempHtmlPath = null;
    try {
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateHTMLDocument(exportData, tempHtmlPath, imagesFolderPath);
        await printHtmlToPdf(tempHtmlPath, filePath);
        console.log('PDF generated successfully using HTML-to-PDF conversion');
    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        throw error;
    } finally {
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}

// Generate merged PDF from multiple articles using Electron's Chromium
export async function generateMergedHTMLToPDF(exportData, filePath, imagesFolderPath, articleService) {
    let tempHtmlPath = null;
    try {
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateMergedHTMLDocument(exportData, tempHtmlPath, imagesFolderPath, articleService);
        await printHtmlToPdf(tempHtmlPath, filePath, { timeout: 60000, waitAfterLoad: 2000 });
        console.log('Merged PDF generated successfully using HTML-to-PDF conversion');
    } catch (error) {
        console.error('Error generating merged PDF from HTML:', error);
        throw error;
    } finally {
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}

// Enhanced PDF generation with custom page settings (Electron's Chromium)
export async function generateCustomHTMLToPDF(exportData, filePath, imagesFolderPath, options = {}) {
    let tempHtmlPath = null;
    const pdfOptions = {
        scale: 0.8,
        printBackground: true,
        timeout: 30000,
        ...options,
    };
    try {
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateHTMLDocument(exportData, tempHtmlPath, imagesFolderPath);
        await printHtmlToPdf(tempHtmlPath, filePath, {
            timeout: pdfOptions.timeout,
            waitAfterLoad: 1000,
            printToPDF: {
                pageSize: pdfOptions.format || 'A4',
                scaleFactor: pdfOptions.scale ?? 0.8,
                printBackground: pdfOptions.printBackground !== false,
            },
        });
        console.log('Custom PDF generated successfully using HTML-to-PDF conversion');
    } catch (error) {
        console.error('Error generating custom PDF from HTML:', error);
        throw error;
    } finally {
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}
