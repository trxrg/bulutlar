/**
 * Converts simple HTML (paragraphs, bold, italic, underline, links) into
 * TipTap JSON so that programmatically created articles render correctly.
 */
import { JSDOM } from 'jsdom';

const TIPTAP_MEDIA_TAG_TO_TYPE = {
    videoNode: 'videoNode',
    imageNode: 'imageNode',
    audioNode: 'audioNode',
};

// Attribute names that our media node extensions persist onto HTML elements.
const MEDIA_HTML_ATTRS = ['id', 'name', 'type', 'path', 'size', 'description'];

function parseMediaAttrs(element) {
    const attrs = {};
    for (const name of MEDIA_HTML_ATTRS) {
        if (element.hasAttribute(name)) {
            const raw = element.getAttribute(name);
            if (name === 'id' || name === 'size') {
                const n = Number(raw);
                attrs[name] = Number.isFinite(n) ? n : raw;
            } else {
                attrs[name] = raw;
            }
        }
    }
    return attrs;
}

function isMediaElement(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.tagName.toLowerCase() !== 'div') return null;
    const dataType = node.getAttribute('data-type');
    return dataType && TIPTAP_MEDIA_TAG_TO_TYPE[dataType] ? dataType : null;
}

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

    const mediaDataType = isMediaElement(node);
    if (mediaDataType) {
        return { type: TIPTAP_MEDIA_TAG_TO_TYPE[mediaDataType], attrs: parseMediaAttrs(node) };
    }

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

export { htmlToTiptapJson };
