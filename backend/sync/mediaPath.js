import path from 'path';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MEDIA_NODE_TYPES = new Set(['imageNode', 'audioNode', 'videoNode']);

function sanitizeExt(s) {
    if (typeof s !== 'string') return '';
    const trimmed = s.trim().replace(/^\.+/, '');
    if (!trimmed) return '';
    if (/[\/\\\s;]/.test(trimmed)) return '';
    if (!/^[A-Za-z0-9]{1,8}$/.test(trimmed)) return '';
    return trimmed.toLowerCase();
}

// Order of preference:
//   1. extension parsed from the original filename (`name`)
//   2. subtype after the slash in a MIME type (`image/jpeg` → `jpeg`)
//   3. extension parsed from the on-disk `path`
//   4. raw `type` if it looks like a bare extension
export function pickMediaExt({ name, type, path: relPath }) {
    const fromName = (() => {
        if (typeof name !== 'string') return '';
        const ext = path.extname(name);
        return ext ? sanitizeExt(ext.slice(1)) : '';
    })();
    if (fromName) return fromName;

    const fromType = (() => {
        if (typeof type !== 'string') return '';
        const t = type.trim();
        if (!t) return '';
        if (t.includes('/')) {
            const sub = t.split(';')[0].split('/').pop();
            return sanitizeExt(sub);
        }
        return sanitizeExt(t);
    })();
    if (fromType) return fromType;

    const fromPath = (() => {
        if (typeof relPath !== 'string') return '';
        const ext = path.extname(relPath);
        return ext ? sanitizeExt(ext.slice(1)) : '';
    })();
    if (fromPath) return fromPath;

    return '';
}

export function buildMediaRelPath(uuid, { name, type, path: relPath } = {}) {
    const ext = pickMediaExt({ name, type, path: relPath });
    return ext ? `${uuid}.${ext}` : uuid;
}

export function uuidFromRelPath(relPath) {
    if (typeof relPath !== 'string' || !relPath.trim()) return null;
    const base = relPath.replace(/\\/g, '/').split('/').pop();
    if (!base) return null;
    const dot = base.lastIndexOf('.');
    const candidate = dot > 0 ? base.slice(0, dot) : base;
    return UUID_RE.test(candidate) ? candidate : null;
}

// Walks a tiptap doc and replaces media-node `attrs.path` via `pathMap`.
// Returns { doc, changed }; never mutates the input.
export function rewriteTiptapMediaPaths(doc, pathMap) {
    if (doc == null || !pathMap || pathMap.size === 0) return { doc, changed: false };
    const state = { changed: false };
    const out = rewriteTiptapNode(doc, pathMap, state);
    return { doc: out, changed: state.changed };
}

function rewriteTiptapNode(node, pathMap, state) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map((n) => rewriteTiptapNode(n, pathMap, state));

    const out = { ...node };
    if (typeof out.type === 'string' && MEDIA_NODE_TYPES.has(out.type) && out.attrs && out.attrs.path != null) {
        const mapped = pathMap.get(out.attrs.path);
        if (mapped != null && mapped !== out.attrs.path) {
            out.attrs = { ...out.attrs, path: mapped };
            state.changed = true;
        }
    }
    if (Array.isArray(out.content)) {
        out.content = out.content.map((c) => rewriteTiptapNode(c, pathMap, state));
    }
    return out;
}

let jsdomPromise = null;
function getJSDOM() {
    if (!jsdomPromise) {
        jsdomPromise = import('jsdom').then((mod) => mod.JSDOM);
    }
    return jsdomPromise;
}

const HTML_MEDIA_TYPES = ['imageNode', 'audioNode', 'videoNode'];

// Replaces `path` on embedded media elements via `pathMap`.
// Returns { html, changed }; never mutates the input string.
export async function rewriteHtmlMediaPaths(html, pathMap) {
    if (!html || typeof html !== 'string' || !pathMap || pathMap.size === 0) {
        return { html, changed: false };
    }
    if (!html.includes('data-type=')) return { html, changed: false };

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const tag of HTML_MEDIA_TYPES) {
        for (const el of doc.querySelectorAll(`[data-type="${tag}"]`)) {
            const oldPath = el.getAttribute('path');
            if (!oldPath) continue;
            const mapped = pathMap.get(oldPath);
            if (mapped != null && mapped !== oldPath) {
                el.setAttribute('path', mapped);
                changed = true;
            }
        }
    }

    return { html: changed ? doc.body.innerHTML : html, changed };
}
