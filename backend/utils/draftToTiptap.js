/**
 * Converts Draft.js raw JSON content to Tiptap JSON format.
 * Handles text blocks (with inline styles and entities) and atomic blocks (media).
 */
function convertDraftToTiptap(draftJson) {
    const draft = typeof draftJson === 'string' ? JSON.parse(draftJson) : draftJson;
    if (!draft || !draft.blocks) return null;

    const tiptapDoc = { type: 'doc', content: [] };
    let i = 0;

    while (i < draft.blocks.length) {
        const block = draft.blocks[i];

        if (block.type === 'atomic') {
            const entityKey = block.entityRanges?.[0]?.key;
            const entity = draft.entityMap?.[String(entityKey)];
            if (entity) {
                const typeMap = { IMAGE: 'imageNode', AUDIO: 'audioNode', VIDEO: 'videoNode' };
                const tiptapType = typeMap[entity.type];
                if (tiptapType) {
                    tiptapDoc.content.push({ type: tiptapType, attrs: entity.data || {} });
                }
            }
            i++;
            continue;
        }

        if (block.type === 'ordered-list-item') {
            const listItems = [];
            while (i < draft.blocks.length && draft.blocks[i].type === 'ordered-list-item') {
                listItems.push(convertListItem(draft.blocks[i], draft.entityMap));
                i++;
            }
            tiptapDoc.content.push({ type: 'orderedList', content: listItems });
            continue;
        }

        if (block.type === 'unordered-list-item') {
            const listItems = [];
            while (i < draft.blocks.length && draft.blocks[i].type === 'unordered-list-item') {
                listItems.push(convertListItem(draft.blocks[i], draft.entityMap));
                i++;
            }
            tiptapDoc.content.push({ type: 'bulletList', content: listItems });
            continue;
        }

        tiptapDoc.content.push(convertTextBlock(block, draft.entityMap));
        i++;
    }

    if (tiptapDoc.content.length === 0) {
        tiptapDoc.content.push({ type: 'paragraph' });
    }

    return tiptapDoc;
}

function convertListItem(block, entityMap) {
    const paragraph = convertTextBlock(block, entityMap);
    paragraph.type = 'paragraph';
    return { type: 'listItem', content: [paragraph] };
}

function convertTextBlock(block, entityMap) {
    const blockTypeMap = {
        'unstyled': 'paragraph',
        'paragraph': 'paragraph',
        'header-one': 'heading',
        'header-two': 'heading',
        'header-three': 'heading',
        'header-four': 'heading',
        'header-five': 'heading',
        'header-six': 'heading',
        'blockquote': 'blockquote',
        'code-block': 'codeBlock',
    };

    const tiptapType = blockTypeMap[block.type] || 'paragraph';
    const node = { type: tiptapType };

    if (tiptapType === 'heading') {
        const levelMap = {
            'header-one': 1, 'header-two': 2, 'header-three': 3,
            'header-four': 4, 'header-five': 5, 'header-six': 6,
        };
        node.attrs = { level: levelMap[block.type] || 1 };
    }

    if (tiptapType === 'blockquote') {
        const innerParagraph = { type: 'paragraph' };
        if (block.text) {
            innerParagraph.content = buildTextNodes(block.text, block.inlineStyleRanges || [], block.entityRanges || [], entityMap);
        }
        node.content = [innerParagraph];
        return node;
    }

    if (block.text) {
        node.content = buildTextNodes(block.text, block.inlineStyleRanges || [], block.entityRanges || [], entityMap);
    }

    return node;
}

function buildTextNodes(text, inlineStyleRanges, entityRanges, entityMap) {
    if (!text) return undefined;

    // Build a per-character map of marks
    const charMarks = new Array(text.length).fill(null).map(() => []);

    for (const style of inlineStyleRanges) {
        const mark = draftStyleToTiptapMark(style.style);
        if (mark) {
            for (let j = style.offset; j < style.offset + style.length && j < text.length; j++) {
                charMarks[j].push(mark);
            }
        }
    }

    for (const entityRange of entityRanges) {
        const entity = entityMap?.[String(entityRange.key)];
        if (entity) {
            const mark = draftEntityToTiptapMark(entity);
            if (mark) {
                for (let j = entityRange.offset; j < entityRange.offset + entityRange.length && j < text.length; j++) {
                    charMarks[j].push(mark);
                }
            }
        }
    }

    // Group consecutive characters with the same marks into text nodes
    const nodes = [];
    let currentText = '';
    let currentMarksJson = '';

    for (let i = 0; i < text.length; i++) {
        const marksJson = JSON.stringify(charMarks[i]);
        if (marksJson !== currentMarksJson) {
            if (currentText) {
                const node = { type: 'text', text: currentText };
                const marks = JSON.parse(currentMarksJson);
                if (marks.length > 0) node.marks = marks;
                nodes.push(node);
            }
            currentText = text[i];
            currentMarksJson = marksJson;
        } else {
            currentText += text[i];
        }
    }

    if (currentText) {
        const node = { type: 'text', text: currentText };
        const marks = JSON.parse(currentMarksJson);
        if (marks.length > 0) node.marks = marks;
        nodes.push(node);
    }

    return nodes.length > 0 ? nodes : undefined;
}

const HIGHLIGHT_COLORS = {
    'HIGHLIGHT': 'var(--highlight-bg)',
    'HIGHLIGHT_GREEN': 'var(--highlight-green-bg)',
    'HIGHLIGHT_BLUE': 'var(--highlight-blue-bg)',
    'HIGHLIGHT_PINK': 'var(--highlight-pink-bg)',
};

function draftStyleToTiptapMark(style) {
    switch (style) {
        case 'BOLD': return { type: 'bold' };
        case 'ITALIC': return { type: 'italic' };
        case 'UNDERLINE': return { type: 'underline' };
        case 'STRIKETHROUGH': return { type: 'strike' };
        case 'CODE': return { type: 'code' };
        case 'SUPERSCRIPT': return { type: 'superscript' };
        case 'SUBSCRIPT': return { type: 'subscript' };
        case 'HIGHLIGHT':
        case 'HIGHLIGHT_GREEN':
        case 'HIGHLIGHT_BLUE':
        case 'HIGHLIGHT_PINK':
            return { type: 'highlight', attrs: { color: HIGHLIGHT_COLORS[style] } };
        default: return null;
    }
}

function draftEntityToTiptapMark(entity) {
    if (entity.type === 'MYLINK') {
        return { type: 'articleLink', attrs: { url: entity.data?.url || null } };
    }
    if (entity.type === 'MYQUOTE') {
        return { type: 'articleQuote', attrs: { annotationId: entity.data?.annotationId || null } };
    }
    return null;
}

/**
 * Detects whether a JSON object is in Draft.js format (has blocks/entityMap).
 */
function isDraftJson(json) {
    if (!json) return false;
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return obj && Array.isArray(obj.blocks) && obj.entityMap !== undefined;
}

/**
 * Detects whether a JSON object is in Tiptap format (has type: 'doc').
 */
function isTiptapJson(json) {
    if (!json) return false;
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return obj && obj.type === 'doc';
}

export { convertDraftToTiptap, isDraftJson, isTiptapJson };
