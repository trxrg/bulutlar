// Per-media-type content filtering for exports.
//
// An article's body is stored in three parallel representations and any
// of them can embed media:
//
//   - tiptap JSON   (textTiptapJson / explanationTiptapJson, comment
//                    tiptapTextJson): media are nodes whose `type` is
//                    'imageNode' | 'audioNode' | 'videoNode'.
//   - draft.js JSON (textJson / explanationJson, comment textJson):
//                    media are `atomic` blocks whose entityRange points
//                    at an entityMap entry typed 'IMAGE' | 'AUDIO' | 'VIDEO'.
//   - HTML string   (text / explanation, comment text): media are
//                    elements carrying `data-type="imageNode"` etc.
//
// When the export UI deselects a media type, the corresponding media
// rows are already dropped from the bundle; these helpers additionally
// scrub the now-dangling references out of every body representation so
// the exported article doesn't ship broken/empty media placeholders.
//
// `excludedNodeTypes` is a Set of tiptap node-type strings
// ('imageNode' | 'audioNode' | 'videoNode'). Each helper is a no-op when
// the set is empty and never mutates its input.

const NODE_TYPE_TO_DRAFT_ENTITY = {
    imageNode: 'IMAGE',
    audioNode: 'AUDIO',
    videoNode: 'VIDEO',
};

// Lazily-loaded JSDOM (expensive import; only needed for the HTML path).
let jsdomPromise = null;
function getJSDOM() {
    if (!jsdomPromise) {
        jsdomPromise = import('jsdom').then((mod) => mod.JSDOM);
    }
    return jsdomPromise;
}

function parseMaybe(value) {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return null; }
}

// Recursively drop tiptap nodes whose `type` is in excludedNodeTypes.
// Preserves the input's string-vs-object shape.
export function stripMediaFromTiptapDoc(doc, excludedNodeTypes) {
    if (doc == null || excludedNodeTypes.size === 0) return doc;
    const wasString = typeof doc === 'string';
    const parsed = parseMaybe(doc);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.content)) return doc;

    const filterNodes = (nodes) => nodes
        .filter((n) => !(n && excludedNodeTypes.has(n.type)))
        .map((n) => (n && Array.isArray(n.content) ? { ...n, content: filterNodes(n.content) } : n));

    const result = { ...parsed, content: filterNodes(parsed.content) };
    return wasString ? JSON.stringify(result) : result;
}

// Drop draft.js atomic blocks whose entity type maps from an excluded
// node type, and prune the matching entityMap entries.
export function stripMediaFromDraftRaw(raw, excludedNodeTypes) {
    if (raw == null || excludedNodeTypes.size === 0) return raw;
    const wasString = typeof raw === 'string';
    const parsed = parseMaybe(raw);
    if (!parsed || !Array.isArray(parsed.blocks)) return raw;

    const excludedEntityTypes = new Set(
        [...excludedNodeTypes].map((t) => NODE_TYPE_TO_DRAFT_ENTITY[t]).filter(Boolean)
    );
    if (excludedEntityTypes.size === 0) return raw;

    const entityMap = parsed.entityMap || {};
    const isExcludedEntity = (key) => {
        const ent = entityMap[key];
        return !!ent && excludedEntityTypes.has(ent.type);
    };

    const blocks = parsed.blocks.filter((b) => {
        if (!b || b.type !== 'atomic') return true;
        const ranges = Array.isArray(b.entityRanges) ? b.entityRanges : [];
        // An atomic media block references exactly one entity; drop the
        // block if any of its ranges points at an excluded media entity.
        return !ranges.some((r) => isExcludedEntity(r.key));
    });

    const prunedEntityMap = {};
    for (const key of Object.keys(entityMap)) {
        if (!excludedEntityTypes.has(entityMap[key]?.type)) {
            prunedEntityMap[key] = entityMap[key];
        }
    }

    const result = { ...parsed, blocks, entityMap: prunedEntityMap };
    return wasString ? JSON.stringify(result) : result;
}

// Remove HTML elements carrying `data-type="<excluded node type>"`.
export async function stripMediaFromHtml(html, excludedNodeTypes) {
    if (!html || typeof html !== 'string' || excludedNodeTypes.size === 0) return html;
    if (!html.includes('data-type=')) return html; // fast path: no media markup

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const nodeType of excludedNodeTypes) {
        for (const el of [...doc.querySelectorAll(`[data-type="${nodeType}"]`)]) {
            el.remove();
            changed = true;
        }
    }

    return changed ? doc.body.innerHTML : html;
}
