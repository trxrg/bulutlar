import { ipcMain } from 'electron';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeHtml(html) {
    if (!html) return '';
    
    // Split content by p tags to handle them individually
    const parts = html.split(/(<\/?p>)/);
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
        } else if (part.trim()) {
            // This is content
            if (inParagraph) {
                currentParagraph += part;
            } else {
                // Content outside paragraphs - wrap in p tags
                if (part.trim()) {
                    result.push(`<p>${part.trim()}</p>`);
                }
            }
        }
    }
    
    // Handle any remaining content
    if (inParagraph && currentParagraph.trim()) {
        result.push(`<p>${currentParagraph.trim()}</p>`);
    }
    
    // Join all paragraphs
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
    let browser = null;
    
    try {
        console.log('Fetching content from URL:', url);
        
        // Validate URL first
        if (!await validateUrl(url)) {
            throw new Error('Invalid URL format');
        }
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the page
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Extract content
        const content = await page.evaluate(() => {
            // Remove script and style elements
            const scripts = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
            scripts.forEach(el => el.remove());
            
            // Try to find the main content
            let mainContent = '';
            let title = '';
            let description = '';
            let author = '';
            let publishedDate = '';
            
            // Get title
            title = document.title || '';
            
            // Try to find meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                description = metaDesc.getAttribute('content') || '';
            }
            
            // Try to find author
            const authorMeta = document.querySelector('meta[name="author"]') || 
                              document.querySelector('[rel="author"]') ||
                              document.querySelector('.author') ||
                              document.querySelector('[class*="author"]');
            if (authorMeta) {
                author = authorMeta.textContent || authorMeta.getAttribute('content') || '';
            }
            
            // Try to find published date
            const dateMeta = document.querySelector('meta[property="article:published_time"]') ||
                           document.querySelector('meta[name="date"]') ||
                           document.querySelector('time[datetime]') ||
                           document.querySelector('.date') ||
                           document.querySelector('[class*="date"]');
            if (dateMeta) {
                publishedDate = dateMeta.getAttribute('content') || 
                               dateMeta.getAttribute('datetime') || 
                               dateMeta.textContent || '';
            }
            
            // Try to find main content using common selectors
            const contentSelectors = [
                'article',
                '.article-content',
                '#renderBody',
                '.post-content',
                '.entry-content',
                '.content',
                '.main-content',
                '[role="main"]',
                'main',
                '.post',
                '.article-body',
                '.story-body',
                '.article-text',
                '.post-body',
                '.entry-body',
                '.article-main',
                '.content-main',
                '.story-content',
                '.article-wrapper',
                '.post-wrapper',
                '.entry-wrapper'
            ];
            
            let mainElement = null;
            for (const selector of contentSelectors) {
                mainElement = document.querySelector(selector);
                if (mainElement) break;
            }
            
            // If no specific content element found, try to find the largest text block
            if (!mainElement) {
                // Try to find the largest div with substantial text content
                const allDivs = document.querySelectorAll('div');
                let largestDiv = null;
                let maxTextLength = 0;
                
                for (const div of allDivs) {
                    const textLength = (div.innerText || div.textContent || '').length;
                    if (textLength > maxTextLength && textLength > 100) { // At least 100 characters
                        maxTextLength = textLength;
                        largestDiv = div;
                    }
                }
                
                mainElement = largestDiv || document.body;
            }
            
            // Extract text content
            if (mainElement) {
                // Check for H1 tag within the main content to use as title
                const h1InContent = mainElement.querySelector('h1');
                if (h1InContent && h1InContent.textContent && h1InContent.textContent.trim()) {
                    title = h1InContent.textContent.trim();
                }
                
                // Extract content preserving <strong>, <p>, and <br> tags but removing other HTML
                let htmlContent = mainElement.innerHTML || '';
                
                // Remove all HTML tags except <strong>, <b>, <p>, and <br>
                htmlContent = htmlContent
                    .replace(/<(?!\/?(?:strong|b|p|br)\b)[^>]*>/gi, '') // Remove all tags except strong/b/p/br
                    .replace(/<\/?(?:b)\b[^>]*>/gi, '<strong>') // Convert <b> to <strong>
                    .replace(/<strong[^>]*>/gi, '<strong>') // Clean <strong> attributes
                    .replace(/<\/strong[^>]*>/gi, '</strong>') // Clean </strong> attributes
                    .replace(/<p[^>]*>/gi, '<p>') // Clean <p> attributes
                    .replace(/<\/p[^>]*>/gi, '</p>') // Clean </p> attributes
                    .replace(/<br[^>]*>/gi, '<br>'); // Clean <br> attributes
                
                mainContent = htmlContent;
                
                // Clean up the content
                mainContent = mainContent
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
                    .trim();
            }
            
            return {
                title: title.trim(),
                content: mainContent,
                description: description.trim(),
                author: author.trim(),
                publishedDate: publishedDate.trim(),
                url: window.location.href
            };
        });
        
        // Sanitize HTML to fix unclosed and nested p tags
        content.content = sanitizeHtml(content.content);
        
        // Clean up content
        content.content = cleanTextContent(content.content);
        content.title = cleanTextContent(content.title);
        content.description = cleanTextContent(content.description);
        content.author = cleanTextContent(content.author);
        
        console.log('Successfully fetched content');
        
        return {
            success: true,
            data: content
        };
        
    } catch (error) {
        console.error('Error fetching content from URL:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function fetchTweetContent(tweetUrl) {
    let browser = null;
    
    try {
        console.log('Fetching tweet content from URL:', tweetUrl);
        
        // Validate URL first
        if (!await validateUrl(tweetUrl)) {
            throw new Error('Invalid URL format');
        }
        
        // Check if it's a Twitter/X URL
        if (!tweetUrl.includes('twitter.com') && !tweetUrl.includes('x.com')) {
            throw new Error('Not a valid Twitter/X URL');
        }
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the tweet
        await page.goto(tweetUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait a bit more for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to wait for tweet content to be visible
        try {
            await page.waitForSelector('[data-testid="tweetText"]', { timeout: 5000 });
        } catch (e) {
            console.log('Tweet text selector not found, continuing anyway...');
        }
        
        // Debug: Save page HTML for inspection (optional)
        const html = await page.content();
        console.log('Page HTML length:', html.length);
        // Save HTML to file for debugging
        const debugPath = path.join(__dirname, '../../debug-tweet.html');
        fs.writeFileSync(debugPath, html);
        console.log('Debug HTML saved to:', debugPath);
        
        // Extract tweet content
        const tweetData = await page.evaluate(() => {
            // Helper function to calculate similarity between two strings
            function calculateSimilarity(str1, str2) {
                if (!str1 || !str2) return 0;
                
                // Simple similarity calculation based on common words
                const words1 = str1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
                const words2 = str2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
                
                if (words1.length === 0 || words2.length === 0) return 0;
                
                const commonWords = words1.filter(word => words2.includes(word));
                const totalWords = Math.max(words1.length, words2.length);
                
                return commonWords.length / totalWords;
            }
            
            let tweetText = '';
            let author = '';
            let username = '';
            let timestamp = '';
            let likes = '';
            let retweets = '';
            let replies = '';
            let quotedTweet = null;
            
            // Debug: Log page structure
            console.log('=== TWEET EXTRACTION DEBUG ===');
            console.log('Page title:', document.title);
            console.log('Total tweets found:', document.querySelectorAll('[data-testid="tweet"]').length);
            console.log('Total articles found:', document.querySelectorAll('[role="article"]').length);
            
            // Try to find tweet text
            const tweetTextSelectors = [
                '[data-testid="tweetText"]',
                '.tweet-text',
                '[role="article"] [lang]',
                '.css-901oao',
                '[data-testid="tweet"] [lang]'
            ];
            
            for (const selector of tweetTextSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    tweetText = element.textContent || element.innerText || '';
                    break;
                }
            }
            
            // Try to find author
            const authorSelectors = [
                '[data-testid="User-Name"] a',
                '.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0',
                '[role="link"] span'
            ];
            
            for (const selector of authorSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    author = element.textContent || element.innerText || '';
                    break;
                }
            }
            
            // Try to find username
            const usernameSelectors = [
                '[data-testid="User-Name"] a[href^="/"]',
                '.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0[href^="/"]'
            ];
            
            for (const selector of usernameSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    username = element.textContent || element.innerText || '';
                    break;
                }
            }
            
            // Try to find timestamp
            const timeSelectors = [
                'time',
                '[data-testid="Time"]',
                'a[href*="/status/"] time'
            ];
            
            for (const selector of timeSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    timestamp = element.getAttribute('datetime') || element.textContent || '';
                    break;
                }
            }
            
            // Try to find engagement metrics
            const metricsSelectors = [
                '[data-testid="reply"]',
                '[data-testid="retweet"]',
                '[data-testid="like"]'
            ];
            
            metricsSelectors.forEach((selector, index) => {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent || element.innerText || '';
                    if (index === 0) replies = text;
                    else if (index === 1) retweets = text;
                    else if (index === 2) likes = text;
                }
            });
            
            // Try to find quoted tweet
            const quotedTweetSelectors = [
                '[data-testid="tweet"] [data-testid="tweet"]', // Nested tweet
                '.quoted-tweet',
                '[role="article"] [role="article"]', // Nested article
                '.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll.r-1ny4l3l', // Common quoted tweet class
                '[data-testid="card.wrapper"]', // Card wrapper for quoted tweets
                '.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll', // Another common quoted tweet pattern
                '[data-testid="tweet"] [data-testid="card.wrapper"]', // Card within tweet
                '.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll.r-1ny4l3l.r-1udh08x', // Extended quoted tweet pattern
                // Additional modern selectors
                '[data-testid="tweet"] [data-testid="card.layoutLarge.media"]', // Media cards
                '[data-testid="tweet"] [data-testid="card.layoutSmall.media"]', // Small media cards
                '[data-testid="tweet"] [data-testid="card.layoutLarge.quote"]', // Quote cards
                '[data-testid="tweet"] [data-testid="card.layoutSmall.quote"]', // Small quote cards
                '[data-testid="tweet"] [data-testid="card.layoutLarge"]', // Large cards
                '[data-testid="tweet"] [data-testid="card.layoutSmall"]', // Small cards
                // Generic patterns that might catch quoted content
                'div[data-testid="tweet"] div[data-testid="tweet"]', // Alternative nested pattern
                'article article', // Nested articles
                '[role="article"] div[role="article"]', // Nested article roles
                // CSS class patterns that might indicate quoted tweets
                '.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll.r-1ny4l3l.r-1udh08x.r-1udh08x', // Extended pattern
                '.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll.r-1ny4l3l.r-1udh08x.r-1udh08x.r-1udh08x' // Even more extended
            ];
            
            console.log('=== QUOTED TWEET DETECTION ===');
            for (let i = 0; i < quotedTweetSelectors.length; i++) {
                const selector = quotedTweetSelectors[i];
                const elements = document.querySelectorAll(selector);
                console.log(`Selector ${i + 1} "${selector}": Found ${elements.length} elements`);
                
                if (elements.length > 0) {
                    elements.forEach((el, idx) => {
                        console.log(`  Element ${idx + 1}:`, {
                            tagName: el.tagName,
                            className: el.className,
                            textLength: (el.textContent || '').length,
                            hasDataTestId: el.getAttribute('data-testid'),
                            innerHTML: el.innerHTML.substring(0, 200) + '...'
                        });
                    });
                }
            }
            
            // Alternative approach: Look for any element that might contain a quoted tweet
            const allElements = document.querySelectorAll('*');
            let potentialQuotedElements = [];
            
            for (const element of allElements) {
                const text = element.textContent || '';
                const className = element.className || '';
                
                // Look for elements that might be quoted tweets based on content patterns
                if (text.length > 50 && text.length < 1000 && 
                    (className.includes('css-') || element.getAttribute('data-testid'))) {
                    
                    // Check if this element contains tweet-like content
                    const hasUserInfo = text.includes('@') || className.includes('User');
                    const hasTimeInfo = element.querySelector('time') || className.includes('Time');
                    const hasTweetText = element.querySelector('[data-testid="tweetText"]') || 
                                       element.querySelector('[lang]');
                    
                    if (hasUserInfo || hasTimeInfo || hasTweetText) {
                        potentialQuotedElements.push({
                            element: element,
                            text: text.substring(0, 100),
                            className: className,
                            hasUserInfo,
                            hasTimeInfo,
                            hasTweetText
                        });
                    }
                }
            }
            
            // NEW APPROACH: Look for elements that contain "Quote" or similar indicators
            console.log('=== LOOKING FOR QUOTE INDICATORS ===');
            const quoteIndicators = document.querySelectorAll('*');
            let quoteElements = [];
            
            for (const element of quoteIndicators) {
                const text = element.textContent || '';
                const ariaLabel = element.getAttribute('aria-label') || '';
                const title = element.getAttribute('title') || '';
                
                // Look for elements that might indicate quoted content
                if (text.includes('Quote') || text.includes('quoted') || 
                    ariaLabel.includes('Quote') || ariaLabel.includes('quoted') ||
                    title.includes('Quote') || title.includes('quoted')) {
                    
                    quoteElements.push({
                        element: element,
                        text: text.substring(0, 100),
                        ariaLabel,
                        title,
                        className: element.className
                    });
                }
            }
            
            console.log('Found', quoteElements.length, 'elements with quote indicators');
            quoteElements.forEach((item, idx) => {
                console.log(`Quote indicator ${idx + 1}:`, item);
            });
            
            // NEW APPROACH: Look for quoted tweet content by analyzing the page structure
            console.log('=== ANALYZING PAGE STRUCTURE FOR QUOTED TWEETS ===');
            const mainTweet = document.querySelector('[data-testid="tweet"]');
            const mainTweetText = mainTweet ? (mainTweet.querySelector('[data-testid="tweetText"]')?.textContent || '').trim() : '';
            
            console.log('Main tweet text:', mainTweetText);
            
            // Look for elements that contain different text content
            const pageElements = document.querySelectorAll('*');
            let quotedCandidates = [];
            
            for (const element of pageElements) {
                const text = (element.textContent || '').trim();
                const className = element.className || '';
                
                // Look for elements that might contain quoted tweet content
                if (text.length > 50 && text.length < 2000 && 
                    text !== mainTweetText && 
                    !text.includes(mainTweetText.substring(0, 30)) &&
                    !mainTweetText.includes(text.substring(0, 30))) {
                    
                    // Check if this element has tweet-like structure
                    const hasUserInfo = text.includes('@') || className.includes('User') || text.includes('·');
                    const hasTimeInfo = element.querySelector('time') || className.includes('Time');
                    const hasTweetText = element.querySelector('[data-testid="tweetText"]') || 
                                       element.querySelector('[lang]') ||
                                       element.querySelector('div[dir="auto"]');
                    
                    // Additional check: look for specific patterns that indicate quoted content
                    const hasQuotedPatterns = text.includes('Grok Code') || 
                                            text.includes('57.6%') || 
                                            text.includes('OpenRouter') ||
                                            text.includes('ranks #1') ||
                                            text.includes('Fast 1') ||
                                            text.includes('Fast is at #4');
                    
                    if ((hasUserInfo || hasTimeInfo || hasTweetText || hasQuotedPatterns) && 
                        text.length > 100) { // Substantial content
                        
                        quotedCandidates.push({
                            element: element,
                            text: text,
                            className: className,
                            hasUserInfo,
                            hasTimeInfo,
                            hasTweetText,
                            hasQuotedPatterns
                        });
                    }
                }
            }
            
            console.log(`Found ${quotedCandidates.length} potential quoted elements`);
            
            // Sort by relevance (elements with more indicators are more likely to be quoted tweets)
            quotedCandidates.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;
                
                if (a.hasUserInfo) scoreA += 2;
                if (a.hasTimeInfo) scoreA += 2;
                if (a.hasTweetText) scoreA += 3;
                if (a.hasQuotedPatterns) scoreA += 5;
                
                if (b.hasUserInfo) scoreB += 2;
                if (b.hasTimeInfo) scoreB += 2;
                if (b.hasTweetText) scoreB += 3;
                if (b.hasQuotedPatterns) scoreB += 5;
                
                return scoreB - scoreA;
            });
            
            // Try to extract quoted tweet from the most promising elements
            for (const potential of quotedCandidates.slice(0, 5)) { // Top 5 candidates
                const element = potential.element;
                const text = potential.text;
                
                console.log('Analyzing potential quoted element:', {
                    textPreview: text.substring(0, 100),
                    className: potential.className,
                    score: potential.hasUserInfo + potential.hasTimeInfo + potential.hasTweetText + potential.hasQuotedPatterns
                });
                
                // Extract quoted tweet information
                let quotedText = '';
                let quotedAuthor = '';
                let quotedUsername = '';
                let quotedTimestamp = '';
                
                // Extract text - try to find the main content
                const textElements = element.querySelectorAll('[lang], [data-testid="tweetText"], div[dir="auto"], span[dir="auto"]');
                if (textElements.length > 0) {
                    for (const textEl of textElements) {
                        const textContent = (textEl.textContent || '').trim();
                        if (textContent.length > 50 && textContent.length < 1000) {
                            quotedText = textContent;
                            break;
                        }
                    }
                }
                
                // If no specific text element found, use the element's text content
                if (!quotedText) {
                    quotedText = text;
                }
                
                // Extract author - look for user information
                const authorElements = element.querySelectorAll('a[href^="/"], [data-testid="User-Name"], span');
                for (const authorEl of authorElements) {
                    const author = (authorEl.textContent || '').trim();
                    if (author.length > 0 && author.length < 50 && 
                        !author.startsWith('@') && 
                        !author.includes('·') &&
                        !author.includes('Grok') &&
                        !author.includes('OpenRouter')) {
                        quotedAuthor = author;
                        break;
                    }
                }
                
                // Extract username - look for @ mentions
                for (const authorEl of authorElements) {
                    const username = (authorEl.textContent || '').trim();
                    if (username.startsWith('@') || (username.length < 30 && username.includes('@'))) {
                        quotedUsername = username.replace('@', '');
                        break;
                    }
                }
                
                // Extract timestamp
                const timeElement = element.querySelector('time');
                if (timeElement) {
                    quotedTimestamp = timeElement.getAttribute('datetime') || timeElement.textContent || '';
                }
                
                console.log('Extracted quoted tweet data:', {
                    quotedText: quotedText.substring(0, 100),
                    quotedAuthor,
                    quotedUsername,
                    quotedTimestamp
                });
                
                // Validate that this is different from main tweet
                if (quotedText && quotedText.length > 50 && quotedText !== mainTweetText) {
                    const isSubset = mainTweetText.includes(quotedText) || quotedText.includes(mainTweetText);
                    const similarity = calculateSimilarity(quotedText, mainTweetText);
                    
                    console.log('Quoted tweet validation:', {
                        isSubset,
                        similarity,
                        threshold: 0.5
                    });
                    
                    if (!isSubset && similarity < 0.5) {
                        quotedTweet = {
                            text: quotedText,
                            author: quotedAuthor,
                            username: quotedUsername,
                            timestamp: quotedTimestamp
                        };
                        console.log('SUCCESS: Using potential element as quoted tweet');
                        break;
                    }
                }
            }
            
            // FALLBACK: Look for the second tweet on the page if no nested tweet found
            if (!quotedTweet) {
                console.log('=== FALLBACK: LOOKING FOR SECOND TWEET ===');
                const allTweets = document.querySelectorAll('[data-testid="tweet"]');
                console.log('Total tweets found:', allTweets.length);
                
                if (allTweets.length > 1) {
                    const secondTweet = allTweets[1];
                    console.log('Second tweet found:', {
                        textLength: (secondTweet.textContent || '').length,
                        textPreview: (secondTweet.textContent || '').substring(0, 100),
                        className: secondTweet.className
                    });
                    
                    // Extract content from second tweet
                    let secondTweetText = '';
                    let secondTweetAuthor = '';
                    let secondTweetUsername = '';
                    let secondTweetTimestamp = '';
                    
                    // Extract text
                    const secondTweetTextElement = secondTweet.querySelector('[data-testid="tweetText"]');
                    if (secondTweetTextElement) {
                        secondTweetText = (secondTweetTextElement.textContent || '').trim();
                    }
                    
                    // Extract author
                    const secondTweetAuthorElement = secondTweet.querySelector('[data-testid="User-Name"] a');
                    if (secondTweetAuthorElement) {
                        secondTweetAuthor = (secondTweetAuthorElement.textContent || '').trim();
                    }
                    
                    // Extract username
                    const secondTweetUsernameElement = secondTweet.querySelector('[data-testid="User-Name"] a[href^="/"]');
                    if (secondTweetUsernameElement) {
                        secondTweetUsername = (secondTweetUsernameElement.textContent || '').trim();
                    }
                    
                    // Extract timestamp
                    const secondTweetTimeElement = secondTweet.querySelector('time');
                    if (secondTweetTimeElement) {
                        secondTweetTimestamp = secondTweetTimeElement.getAttribute('datetime') || secondTweetTimeElement.textContent || '';
                    }
                    
                    console.log('Second tweet extracted:', {
                        text: secondTweetText.substring(0, 100),
                        author: secondTweetAuthor,
                        username: secondTweetUsername,
                        timestamp: secondTweetTimestamp
                    });
                    
                    // Validate that this is different from main tweet
                    if (secondTweetText && secondTweetText.length > 10 && secondTweetText !== mainTweetText) {
                        const isSubset = mainTweetText.includes(secondTweetText) || secondTweetText.includes(mainTweetText);
                        const similarity = calculateSimilarity(secondTweetText, mainTweetText);
                        
                        console.log('Second tweet validation:', {
                            isSubset,
                            similarity,
                            threshold: 0.7
                        });
                        
                        if (!isSubset && similarity < 0.7) {
                            quotedTweet = {
                                text: secondTweetText,
                                author: secondTweetAuthor,
                                username: secondTweetUsername,
                                timestamp: secondTweetTimestamp
                            };
                            console.log('SUCCESS: Using second tweet as quoted tweet');
                        }
                    }
                }
            }
            
            console.log('=== POTENTIAL QUOTED ELEMENTS ===');
            console.log(`Found ${potentialQuotedElements.length} potential quoted elements`);
            potentialQuotedElements.forEach((item, idx) => {
                console.log(`Potential ${idx + 1}:`, item);
            });
            
            for (const selector of quotedTweetSelectors) {
                const quotedElement = document.querySelector(selector);
                const mainTweet = document.querySelector('[data-testid="tweet"]');
                
                // More robust check to ensure we're not getting the main tweet
                if (quotedElement && quotedElement !== mainTweet && 
                    !quotedElement.contains(mainTweet) && 
                    !mainTweet.contains(quotedElement)) {
                    
                    // Additional check: make sure the quoted element has different content
                    const mainTweetText = mainTweet ? (mainTweet.textContent || '').trim() : '';
                    const quotedElementText = (quotedElement.textContent || '').trim();
                    
                    // Skip if the content is too similar (likely the same tweet)
                    if (quotedElementText.length > 0 && 
                        quotedElementText !== mainTweetText &&
                        !quotedElementText.includes(mainTweetText.substring(0, 50))) {
                        
                        console.log('Found potential quoted tweet with selector:', selector);
                        console.log('Main tweet text length:', mainTweetText.length);
                        console.log('Quoted element text length:', quotedElementText.length);
                        console.log('Quoted element preview:', quotedElementText.substring(0, 100));
                        
                        // Extract quoted tweet information
                        let quotedText = '';
                        let quotedAuthor = '';
                        let quotedUsername = '';
                        let quotedTimestamp = '';
                    
                        // Find quoted tweet text - try multiple approaches
                        const quotedTextSelectors = [
                            '[data-testid="tweetText"]',
                            '[lang]',
                            '.css-901oao',
                            'div[dir="auto"]',
                            'span[dir="auto"]'
                        ];
                        
                        for (const textSelector of quotedTextSelectors) {
                            const textElement = quotedElement.querySelector(textSelector);
                            if (textElement) {
                                const text = textElement.textContent || textElement.innerText || '';
                                if (text.length > 10) { // Only use substantial text
                                    quotedText = text;
                                    break;
                                }
                            }
                        }
                        
                        // Additional validation: make sure we're not getting the main tweet text
                        const mainTweetTextElement = mainTweet ? mainTweet.querySelector('[data-testid="tweetText"]') : null;
                        const mainTweetText = mainTweetTextElement ? (mainTweetTextElement.textContent || '').trim() : '';
                        
                        console.log('Text comparison:');
                        console.log('Main tweet text:', mainTweetText);
                        console.log('Quoted text:', quotedText.trim());
                        console.log('Are they the same?', quotedText.trim() === mainTweetText);
                        
                        // If the quoted text is the same as main tweet text, try to find different text
                        if (quotedText.trim() === mainTweetText && quotedText.trim().length > 0) {
                            console.log('Quoted text same as main tweet, trying alternative extraction...');
                            
                            // Try to find text that's NOT in the main tweet
                            const allTextElements = quotedElement.querySelectorAll('*');
                            for (const textEl of allTextElements) {
                                const altText = (textEl.textContent || textEl.innerText || '').trim();
                                if (altText.length > 20 && 
                                    altText !== mainTweetText && 
                                    !altText.includes(mainTweetText.substring(0, 30)) &&
                                    !mainTweetText.includes(altText.substring(0, 30))) {
                                    quotedText = altText;
                                    console.log('Found alternative quoted text:', altText.substring(0, 100));
                                    break;
                                }
                            }
                            
                            // If still no different text found, try looking for nested tweet structures
                            if (quotedText.trim() === mainTweetText) {
                                console.log('Still same text, looking for nested tweet structures...');
                                
                                // Look for any nested elements that might contain the actual quoted tweet
                                const nestedTweets = quotedElement.querySelectorAll('[data-testid="tweet"], [role="article"]');
                                for (const nestedTweet of nestedTweets) {
                                    if (nestedTweet !== mainTweet) {
                                        const nestedText = (nestedTweet.textContent || '').trim();
                                        if (nestedText.length > 20 && nestedText !== mainTweetText) {
                                            quotedText = nestedText;
                                            console.log('Found nested tweet text:', nestedText.substring(0, 100));
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Find quoted tweet author - try multiple approaches
                        const quotedAuthorSelectors = [
                            '[data-testid="User-Name"] a',
                            'a[href^="/"] span',
                            '[data-testid="User-Name"] span',
                            'div[dir="ltr"] span'
                        ];
                        
                        for (const authorSelector of quotedAuthorSelectors) {
                            const authorElement = quotedElement.querySelector(authorSelector);
                            if (authorElement) {
                                const author = authorElement.textContent || authorElement.innerText || '';
                                if (author.length > 0 && author.length < 50) { // Reasonable author name length
                                    quotedAuthor = author;
                                    break;
                                }
                            }
                        }
                        
                        // Find quoted tweet username - try multiple approaches
                        const quotedUsernameSelectors = [
                            '[data-testid="User-Name"] a[href^="/"]',
                            'a[href^="/"]',
                            'a[href*="/"]'
                        ];
                        
                        for (const usernameSelector of quotedUsernameSelectors) {
                            const usernameElement = quotedElement.querySelector(usernameSelector);
                            if (usernameElement) {
                                const username = usernameElement.textContent || usernameElement.innerText || '';
                                if (username.startsWith('@') || username.length < 30) { // Reasonable username
                                    quotedUsername = username.replace('@', '');
                                    break;
                                }
                            }
                        }
                        
                        // Find quoted tweet timestamp
                        const quotedTimeSelectors = [
                            'time',
                            '[data-testid="Time"]',
                            'a time'
                        ];
                        
                        for (const timeSelector of quotedTimeSelectors) {
                            const timeElement = quotedElement.querySelector(timeSelector);
                            if (timeElement) {
                                quotedTimestamp = timeElement.getAttribute('datetime') || timeElement.textContent || '';
                                break;
                            }
                        }
                        
                        console.log('Extracted quoted tweet data:', {
                            quotedText: quotedText.substring(0, 100),
                            quotedAuthor,
                            quotedUsername,
                            quotedTimestamp
                        });
                        
                        // Only create quoted tweet if we have substantial content and it's different from main tweet
                        if (quotedText && quotedText.length > 10 && quotedText !== mainTweetText) {
                            // Additional check: make sure it's not just a subset of the main tweet
                            const isSubset = mainTweetText.includes(quotedText.trim()) || quotedText.trim().includes(mainTweetText);
                            const similarityThreshold = 0.8; // 80% similarity threshold
                            const similarity = calculateSimilarity(quotedText.trim(), mainTweetText);
                            
                            console.log('Final validation:');
                            console.log('Is subset?', isSubset);
                            console.log('Similarity:', similarity);
                            
                            if (!isSubset && similarity < similarityThreshold) {
                                quotedTweet = {
                                    text: quotedText.trim(),
                                    author: quotedAuthor.trim(),
                                    username: quotedUsername.trim(),
                                    timestamp: quotedTimestamp.trim()
                                };
                                console.log('SUCCESS: Created quoted tweet object');
                                break;
                            } else {
                                console.log('SKIPPED: Content too similar to main tweet (similarity:', similarity, ')');
                            }
                        } else {
                            console.log('SKIPPED: Quoted tweet too similar to main tweet or insufficient content');
                        }
                    } else {
                        console.log('SKIPPED: Element is too similar to main tweet');
                    }
                }
            }
            
            // Fallback: Try to extract quoted tweet from potential elements
            if (!quotedTweet && potentialQuotedElements.length > 0) {
                console.log('=== FALLBACK QUOTED TWEET EXTRACTION ===');
                
                for (const potential of potentialQuotedElements) {
                    const element = potential.element;
                    const mainTweet = document.querySelector('[data-testid="tweet"]');
                    
                    // Skip if this is the main tweet or too similar
                    if (element === mainTweet) {
                        continue;
                    }
                    
                    const mainTweetText = mainTweet ? (mainTweet.textContent || '').trim() : '';
                    const elementText = (element.textContent || '').trim();
                    
                    // Skip if content is too similar to main tweet
                    if (elementText === mainTweetText || 
                        elementText.includes(mainTweetText.substring(0, 50))) {
                        console.log('Fallback: Skipping element too similar to main tweet');
                        continue;
                    }
                    
                    // Extract text from this element
                    let quotedText = '';
                    let quotedAuthor = '';
                    let quotedUsername = '';
                    let quotedTimestamp = '';
                    
                    // Try to find text content
                    const textElements = element.querySelectorAll('[lang], [data-testid="tweetText"], div[dir="auto"], span[dir="auto"]');
                    for (const textEl of textElements) {
                        const text = textEl.textContent || textEl.innerText || '';
                        if (text.length > 20 && text.length < 500) {
                            quotedText = text;
                            break;
                        }
                    }
                    
                    // Try to find author
                    const authorElements = element.querySelectorAll('a[href^="/"], [data-testid="User-Name"]');
                    for (const authorEl of authorElements) {
                        const author = authorEl.textContent || authorEl.innerText || '';
                        if (author.length > 0 && author.length < 50 && !author.startsWith('@')) {
                            quotedAuthor = author;
                            break;
                        }
                    }
                    
                    // Try to find username
                    for (const authorEl of authorElements) {
                        const username = authorEl.textContent || authorEl.innerText || '';
                        if (username.startsWith('@') || (username.length < 30 && username.includes('@'))) {
                            quotedUsername = username.replace('@', '');
                            break;
                        }
                    }
                    
                    // Try to find timestamp
                    const timeElement = element.querySelector('time');
                    if (timeElement) {
                        quotedTimestamp = timeElement.getAttribute('datetime') || timeElement.textContent || '';
                    }
                    
                    console.log('Fallback extraction attempt:', {
                        quotedText: quotedText.substring(0, 100),
                        quotedAuthor,
                        quotedUsername,
                        quotedTimestamp
                    });
                    
                    if (quotedText && quotedText.length > 20) {
                        // Final check: make sure quoted text is different from main tweet
                        const mainTweetText = document.querySelector('[data-testid="tweet"]') ? 
                            (document.querySelector('[data-testid="tweet"]').textContent || '').trim() : '';
                        
                        if (quotedText.trim() !== mainTweetText && 
                            !quotedText.trim().includes(mainTweetText.substring(0, 50))) {
                            
                            quotedTweet = {
                                text: quotedText.trim(),
                                author: quotedAuthor.trim(),
                                username: quotedUsername.trim(),
                                timestamp: quotedTimestamp.trim()
                            };
                            console.log('SUCCESS: Found quoted tweet via fallback method');
                            break;
                        } else {
                            console.log('Fallback: Quoted text too similar to main tweet, skipping');
                        }
                    }
                }
            }
            
            return {
                tweetText: tweetText.trim(),
                author: author.trim(),
                username: username.trim(),
                timestamp: timestamp.trim(),
                likes: likes.trim(),
                retweets: retweets.trim(),
                replies: replies.trim(),
                quotedTweet: quotedTweet,
                url: window.location.href
            };
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
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Simple similarity calculation based on common words
    const words1 = str1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const words2 = str2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
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
