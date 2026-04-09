/**
 * Converts simple HTML (paragraphs, bold, italic, underline, links) into
 * TipTap JSON and Draft.js rawContentState so that programmatically created
 * articles render correctly in both editor modes.
 */
import { JSDOM } from 'jsdom';

function htmlToTiptapJson(html) {
    if (!html) return null;
    const dom = new JSDOM(html);
    const body = dom.window.document.body;
    const content = [];

    for (const node of body.childNodes) {
        const block = convertNodeToTiptap(node);
        if (block) content.push(block);
    }

    if (content.length === 0) {
        content.push({ type: 'paragraph' });
    }

    return { type: 'doc', content };
}

function convertNodeToTiptap(node) {
    if (node.nodeType === 3) {
        const text = node.textContent;
        if (!text.trim()) return null;
        return { type: 'paragraph', content: [{ type: 'text', text }] };
    }

    if (node.nodeType !== 1) return null;

    const tag = node.tagName.toLowerCase();

    if (tag === 'p' || tag === 'div') {
        const inlineContent = convertInlineChildren(node);
        return { type: 'paragraph', content: inlineContent.length ? inlineContent : undefined };
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
        const level = parseInt(tag[1]);
        const inlineContent = convertInlineChildren(node);
        return { type: 'heading', attrs: { level }, content: inlineContent.length ? inlineContent : undefined };
    }

    if (tag === 'ul' || tag === 'ol') {
        const items = [];
        for (const li of node.children) {
            if (li.tagName.toLowerCase() === 'li') {
                const inlineContent = convertInlineChildren(li);
                items.push({
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: inlineContent.length ? inlineContent : undefined }]
                });
            }
        }
        return { type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items };
    }

    if (tag === 'blockquote') {
        const inlineContent = convertInlineChildren(node);
        return { type: 'blockquote', content: [{ type: 'paragraph', content: inlineContent.length ? inlineContent : undefined }] };
    }

    const inlineContent = convertInlineChildren(node);
    return { type: 'paragraph', content: inlineContent.length ? inlineContent : undefined };
}

function convertInlineChildren(node) {
    const result = [];
    for (const child of node.childNodes) {
        collectInlineNodes(child, [], result);
    }
    return result;
}

function collectInlineNodes(node, marks, result) {
    if (node.nodeType === 3) {
        const text = node.textContent;
        if (text) {
            const entry = { type: 'text', text };
            if (marks.length) entry.marks = [...marks];
            result.push(entry);
        }
        return;
    }

    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    const newMarks = [...marks];

    if (tag === 'strong' || tag === 'b') newMarks.push({ type: 'bold' });
    if (tag === 'em' || tag === 'i') newMarks.push({ type: 'italic' });
    if (tag === 'u') newMarks.push({ type: 'underline' });
    if (tag === 's' || tag === 'strike') newMarks.push({ type: 'strike' });
    if (tag === 'code') newMarks.push({ type: 'code' });
    if (tag === 'a') {
        const href = node.getAttribute('href');
        if (href) newMarks.push({ type: 'link', attrs: { href, target: '_blank' } });
    }
    if (tag === 'sub') newMarks.push({ type: 'subscript' });
    if (tag === 'sup') newMarks.push({ type: 'superscript' });
    if (tag === 'mark') newMarks.push({ type: 'highlight' });

    if (tag === 'br') {
        result.push({ type: 'hardBreak' });
        return;
    }

    for (const child of node.childNodes) {
        collectInlineNodes(child, newMarks, result);
    }
}

// --- Draft.js raw content state ---

function htmlToDraftRaw(html) {
    if (!html) return null;
    const dom = new JSDOM(html);
    const body = dom.window.document.body;
    const blocks = [];

    for (const node of body.childNodes) {
        const block = convertNodeToDraft(node);
        if (block) blocks.push(...(Array.isArray(block) ? block : [block]));
    }

    if (blocks.length === 0) {
        blocks.push(makeDraftBlock('', 'unstyled'));
    }

    return { blocks, entityMap: {} };
}

function makeDraftBlock(text, type, inlineStyleRanges = []) {
    const key = Math.random().toString(36).substring(2, 7);
    return { key, text, type, depth: 0, inlineStyleRanges, entityRanges: [], data: {} };
}

function convertNodeToDraft(node) {
    if (node.nodeType === 3) {
        const text = node.textContent;
        if (!text.trim()) return null;
        return makeDraftBlock(text, 'unstyled');
    }
    if (node.nodeType !== 1) return null;

    const tag = node.tagName.toLowerCase();

    let blockType = 'unstyled';
    if (tag === 'h1') blockType = 'header-one';
    else if (tag === 'h2') blockType = 'header-two';
    else if (tag === 'h3') blockType = 'header-three';
    else if (tag === 'blockquote') blockType = 'blockquote';

    if (tag === 'ul' || tag === 'ol') {
        const listType = tag === 'ul' ? 'unordered-list-item' : 'ordered-list-item';
        const items = [];
        for (const li of node.children) {
            if (li.tagName.toLowerCase() === 'li') {
                const { text, styles } = extractTextAndStyles(li);
                items.push(makeDraftBlock(text, listType, styles));
            }
        }
        return items;
    }

    const { text, styles } = extractTextAndStyles(node);
    return makeDraftBlock(text, blockType, styles);
}

function extractTextAndStyles(node) {
    const result = { text: '', styles: [] };
    collectDraftInline(node, [], result);
    return result;
}

function collectDraftInline(node, activeStyles, result) {
    if (node.nodeType === 3) {
        const text = node.textContent;
        if (text) {
            const offset = result.text.length;
            result.text += text;
            for (const style of activeStyles) {
                result.styles.push({ offset, length: text.length, style });
            }
        }
        return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    const newStyles = [...activeStyles];
    if (tag === 'strong' || tag === 'b') newStyles.push('BOLD');
    if (tag === 'em' || tag === 'i') newStyles.push('ITALIC');
    if (tag === 'u') newStyles.push('UNDERLINE');
    if (tag === 'code') newStyles.push('CODE');

    for (const child of node.childNodes) {
        collectDraftInline(child, newStyles, result);
    }
}

export { htmlToTiptapJson, htmlToDraftRaw };
