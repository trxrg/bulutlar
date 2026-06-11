// Receiver-side HTML inverse of tiptapResolve.js.
//
// Walks embedded media elements in an HTML string and re-links each one to
// the freshly inserted local media row via `mediaInfoByUuid`. The desktop
// renderer resolves media by `id`; imported HTML still carries the exporter's
// local id until this pass runs.

import { uuidFromRelPath } from './mediaPath.js';

const HTML_MEDIA_TYPES = ['imageNode', 'audioNode', 'videoNode'];

let jsdomPromise = null;
function getJSDOM() {
    if (!jsdomPromise) {
        jsdomPromise = import('jsdom').then((mod) => mod.JSDOM);
    }
    return jsdomPromise;
}

function applyMediaInfo(el, info) {
    el.setAttribute('id', String(info.id));
    if (info.name != null) el.setAttribute('name', info.name);
    if (info.type != null) el.setAttribute('type', info.type);
    if (info.path != null) el.setAttribute('path', info.path);
    if (info.size != null) el.setAttribute('size', String(info.size));
    if (info.description != null) el.setAttribute('description', info.description);
    if (info.duration != null) el.setAttribute('duration', String(info.duration));
    if (info.width != null) el.setAttribute('width', String(info.width));
    if (info.height != null) el.setAttribute('height', String(info.height));
}

function resolveUuidFromElement(el) {
    const uuidAttr = el.getAttribute('uuid');
    if (uuidAttr) return uuidAttr;
    const pathAttr = el.getAttribute('path');
    return uuidFromRelPath(pathAttr);
}

// Returns { html, changed }. Never mutates the input string.
export async function resolveHtmlMedia(html, mediaInfoByUuid) {
    if (!html || typeof html !== 'string' || !mediaInfoByUuid || mediaInfoByUuid.size === 0) {
        return { html, changed: false };
    }
    if (!html.includes('data-type=')) return { html, changed: false };

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const tag of HTML_MEDIA_TYPES) {
        for (const el of doc.querySelectorAll(`[data-type="${tag}"]`)) {
            const uuid = resolveUuidFromElement(el);
            if (uuid == null) continue;
            const info = mediaInfoByUuid.get(uuid);
            if (!info) continue;
            applyMediaInfo(el, info);
            changed = true;
        }
    }

    return { html: changed ? doc.body.innerHTML : html, changed };
}
