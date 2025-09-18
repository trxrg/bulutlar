import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { generateHTMLDocument, generateMergedHTMLDocument } from './htmlGeneration.js';

// Generate PDF from HTML using Puppeteer (much better quality than current PDF generation)
export async function generateHTMLToPDF(exportData, filePath, imagesFolderPath) {
    let browser = null;
    let tempHtmlPath = null;
    
    try {
        // Generate temporary HTML file
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateHTMLDocument(exportData, tempHtmlPath, imagesFolderPath);
        
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-extensions'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport for consistent rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
        });
        
        // Load the HTML file
        const htmlContent = await fs.readFile(tempHtmlPath, 'utf8');
        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });
        
        // Generate PDF with high quality settings
        await page.pdf({
            path: filePath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            scale: 0.8, // Slightly smaller scale for better fit
            timeout: 30000
        });
        
        console.log('PDF generated successfully using HTML-to-PDF conversion');
        
    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        throw error;
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
        }
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}

// Generate merged PDF from multiple articles using HTML-to-PDF conversion
export async function generateMergedHTMLToPDF(exportData, filePath, imagesFolderPath, articleService) {
    let browser = null;
    let tempHtmlPath = null;
    
    try {
        // Generate temporary HTML file
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateMergedHTMLDocument(exportData, tempHtmlPath, imagesFolderPath, articleService);
        
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-extensions'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport for consistent rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
        });
        
        // Load the HTML file
        const htmlContent = await fs.readFile(tempHtmlPath, 'utf8');
        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 60000 // Longer timeout for merged documents
        });
        
        // Wait a bit more for any dynamic content to load
        await page.waitForTimeout(2000);
        
        // Generate PDF with high quality settings
        await page.pdf({
            path: filePath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            scale: 0.8,
            timeout: 60000
        });
        
        console.log('Merged PDF generated successfully using HTML-to-PDF conversion');
        
    } catch (error) {
        console.error('Error generating merged PDF from HTML:', error);
        throw error;
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
        }
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}

// Enhanced PDF generation with custom page settings
export async function generateCustomHTMLToPDF(exportData, filePath, imagesFolderPath, options = {}) {
    let browser = null;
    let tempHtmlPath = null;
    
    const defaultOptions = {
        format: 'A4',
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
        },
        scale: 0.8,
        printBackground: true,
        timeout: 30000
    };
    
    const pdfOptions = { ...defaultOptions, ...options };
    
    try {
        // Generate temporary HTML file
        tempHtmlPath = filePath.replace(/\.pdf$/i, '_temp.html');
        await generateHTMLDocument(exportData, tempHtmlPath, imagesFolderPath);
        
        // Launch headless browser with optimized settings
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
        });
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Load the HTML file
        const htmlContent = await fs.readFile(tempHtmlPath, 'utf8');
        await page.setContent(htmlContent, {
            waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
            timeout: pdfOptions.timeout
        });
        
        // Wait for fonts and images to load
        await page.evaluateHandle('document.fonts.ready');
        await page.waitForTimeout(1000);
        
        // Generate PDF
        await page.pdf({
            path: filePath,
            format: pdfOptions.format,
            margin: pdfOptions.margin,
            printBackground: pdfOptions.printBackground,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            scale: pdfOptions.scale,
            timeout: pdfOptions.timeout
        });
        
        console.log('Custom PDF generated successfully using HTML-to-PDF conversion');
        
    } catch (error) {
        console.error('Error generating custom PDF from HTML:', error);
        throw error;
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
        }
        if (tempHtmlPath) {
            try {
                await fs.unlink(tempHtmlPath);
            } catch (cleanupError) {
                console.warn('Could not delete temporary HTML file:', cleanupError);
            }
        }
    }
}
