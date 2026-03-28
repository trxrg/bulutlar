import { ipcMain, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Create a hidden BrowserWindow, load url, run extraction script, return result. Uses Electron's Chromium. */
async function withBrowserWindow(url, options = {}) {
    const { scriptPath, waitAfterLoad = 0 } = options;
    const script = fs.readFileSync(path.join(__dirname, 'utils', scriptPath), 'utf8');
    const win = new BrowserWindow({
        show: false,
        width: 1280,
        height: 720,
        webPreferences: {
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'url-fetch',
        },
    });
    try {
        win.webContents.setUserAgent(USER_AGENT);
        // loadURL returns a promise that resolves when the page finishes loading
        await win.loadURL(url, { userAgent: USER_AGENT });
        if (waitAfterLoad > 0) {
            await new Promise((r) => setTimeout(r, waitAfterLoad));
        }
        const result = await win.webContents.executeJavaScript(script);
        return result;
    } finally {
        const ses = win.webContents.session;
        win.destroy();
        await ses.clearStorageData();
        await ses.clearCache();
    }
}

function sanitizeHtml(html) {
    if (!html) return '';
    
    // Split content by p tags and heading tags to handle them individually
    const parts = html.split(/(<\/?p>|<\/?h[1-6]>)/);
    const result = [];
    let inParagraph = false;
    let currentParagraph = '';
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part === '<p>') {
            // Close any existing paragraph before starting a new one
            if (inParagraph && currentParagraph.trim()) {
                result.push(`<p>${currentParagraph.trim()}</p>`);
            }
            inParagraph = true;
            currentParagraph = '';
        } else if (part === '</p>') {
            if (inParagraph && currentParagraph.trim()) {
                result.push(`<p>${currentParagraph.trim()}</p>`);
            }
            inParagraph = false;
            currentParagraph = '';
        } else if (/^<h[1-6]>$/.test(part)) {
            // Handle opening heading tags
            if (inParagraph && currentParagraph.trim()) {
                result.push(`<p>${currentParagraph.trim()}</p>`);
            }
            inParagraph = false;
            currentParagraph = '';
            result.push(part);
        } else if (/^<\/h[1-6]>$/.test(part)) {
            // Handle closing heading tags
            if (inParagraph && currentParagraph.trim()) {
                result.push(`<p>${currentParagraph.trim()}</p>`);
            }
            inParagraph = false;
            currentParagraph = '';
            result.push(part);
        } else if (part.trim()) {
            // This is content
            if (inParagraph) {
                currentParagraph += part;
            } else {
                // Content outside paragraphs - check if it's part of a heading
                const prevPart = parts[i - 1];
                if (prevPart && /^<h[1-6]>$/.test(prevPart)) {
                    // This content belongs to a heading, add it directly
                    result.push(part);
                } else {
                    // Content outside paragraphs and headings - wrap in p tags
                    if (part.trim()) {
                        result.push(`<p>${part.trim()}</p>`);
                    }
                }
            }
        }
    }
    
    // Handle any remaining content
    if (inParagraph && currentParagraph.trim()) {
        result.push(`<p>${currentParagraph.trim()}</p>`);
    }
    
    // Join all paragraphs and headings
    let sanitized = result.join('');
    
    // Clean up any remaining issues
    sanitized = sanitized
        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
        .replace(/<p>\s*<p>/g, '<p>') // Fix nested opening p tags
        .replace(/<\/p>\s*<\/p>/g, '</p>') // Fix nested closing p tags
        .replace(/<p>\s*<br>\s*<\/p>/g, '<br>') // Convert empty paragraphs with br to just br
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    return sanitized;
}

function initService() {
    ipcMain.handle('url/fetchContent', async (event, url) => await fetchContentFromUrl(url));
    ipcMain.handle('url/fetchTweet', async (event, tweetUrl) => await fetchTweetContent(tweetUrl));
    ipcMain.handle('url/validateUrl', async (event, url) => await validateUrl(url));
    
    console.info('UrlFetchService initialized');
}

async function validateUrl(url) {
    try {
        const urlPattern = /^https?:\/\/.+/;
        return urlPattern.test(url);
    } catch (error) {
        console.error('Error validating URL:', error);
        return false;
    }
}

async function fetchContentFromUrl(url) {
    try {
        console.log('Fetching content from URL:', url);
        if (!await validateUrl(url)) {
            throw new Error('Invalid URL format');
        }
        const content = await withBrowserWindow(url, { scriptPath: 'extractArticleContent.browser.txt' });
        content.content = sanitizeHtml(content.content);
        content.content = cleanTextContent(content.content);
        content.title = cleanTextContent(content.title);
        content.description = cleanTextContent(content.description);
        content.author = cleanTextContent(content.author);
        console.log('Successfully fetched content');
        return { success: true, data: content };
    } catch (error) {
        console.error('Error fetching content from URL:', error);
        return { success: false, error: error.message };
    }
}

async function fetchTweetContent(tweetUrl) {
    try {
        console.log('Fetching tweet content from URL:', tweetUrl);
        if (!await validateUrl(tweetUrl)) {
            throw new Error('Invalid URL format');
        }
        if (!tweetUrl.includes('twitter.com') && !tweetUrl.includes('x.com')) {
            throw new Error('Not a valid Twitter/X URL');
        }
        const tweetData = await withBrowserWindow(tweetUrl, {
            scriptPath: 'extractTweetContent.browser.txt',
            waitAfterLoad: 2000,
        });
        // Clean up content
        tweetData.tweetText = cleanTextContent(tweetData.tweetText);
        tweetData.author = cleanTextContent(tweetData.author);
        tweetData.username = cleanTextContent(tweetData.username);
        
        // Clean up quoted tweet content if it exists
        if (tweetData.quotedTweet) {
            tweetData.quotedTweet.text = cleanTextContent(tweetData.quotedTweet.text);
            tweetData.quotedTweet.author = cleanTextContent(tweetData.quotedTweet.author);
            tweetData.quotedTweet.username = cleanTextContent(tweetData.quotedTweet.username);
        }
        
        // Format the tweet content with datetime and quoted tweet
        tweetData.formattedContent = formatTweetContent(tweetData);
        
        console.log('Successfully fetched tweet:', {
            author: tweetData.author,
            username: tweetData.username,
            textLength: tweetData.tweetText.length,
            timestamp: tweetData.timestamp,
            hasQuotedTweet: !!tweetData.quotedTweet,
            quotedAuthor: tweetData.quotedTweet?.author || 'N/A'
        });
        
        return {
            success: true,
            data: tweetData
        };
    } catch (error) {
        console.error('Error fetching tweet content:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function formatTweetContent(tweetData) {
    let content = '';
    
    // Add original tweet content with datetime
    if (tweetData.tweetText) {
        content += tweetData.tweetText;
        
        // Add datetime if available
        if (tweetData.timestamp) {
            try {
                const date = new Date(tweetData.timestamp);
                const formattedDate = date.toLocaleString();
                content += `\n\nPosted: ${formattedDate}`;
            } catch (e) {
                content += `\n\nPosted: ${tweetData.timestamp}`;
            }
        }
    }
    
    // Add quoted tweet if it exists
    if (tweetData.quotedTweet) {
        content += '\n\n--- QUOTED TWEET ---\n';
        
        // Add quoted account info
        if (tweetData.quotedTweet.author) {
            content += `QUOTED ACCOUNT: ${tweetData.quotedTweet.author}`;
            if (tweetData.quotedTweet.username) {
                content += ` (@${tweetData.quotedTweet.username})`;
            }
            content += '\n';
        }
        
        // Add quoted content
        if (tweetData.quotedTweet.text) {
            content += `QUOTED CONTENT: ${tweetData.quotedTweet.text}\n`;
        }
        
        // Add quoted tweet datetime
        if (tweetData.quotedTweet.timestamp) {
            try {
                const quotedDate = new Date(tweetData.quotedTweet.timestamp);
                const formattedQuotedDate = quotedDate.toLocaleString();
                content += `DATETIME: ${formattedQuotedDate}`;
            } catch (e) {
                content += `DATETIME: ${tweetData.quotedTweet.timestamp}`;
            }
        }
    }
    
    return content;
}

function cleanTextContent(text) {
    if (!text) return '';
    
    return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable characters
        .trim();
}

const UrlFetchService = {
    initService,
    fetchContentFromUrl,
    fetchTweetContent,
    validateUrl
};

export default UrlFetchService;
