// Phase 3: rewrite embedded HTML media for the on-disk wire format.
//
// Walks `[data-type="imageNode"|"audioNode"|"videoNode"]` elements and
// replaces attrs with the wire shape locked in `backend/sync/types.js`:
//
//     uuid, name?, description?
//
// Drops desktop-local `id`, `path`, `type`, `size`, `duration`, `width`,
// `height`. `idToUuid` is a Map<localId, uuid> built by the caller from
// the article's media rows.
//
// Returns { html, changed }; does NOT mutate the input string.

import { uuidFromRelPath } from './mediaPath.js';

const HTML_MEDIA_TYPES = ['imageNode', 'audioNode', 'videoNode'];
const STRIP_ATTRS = ['id', 'path', 'type', 'size', 'duration', 'width', 'height'];

let jsdomPromise = null;
function getJSDOM() {
    if (!jsdomPromise) {
        jsdomPromise = import('jsdom').then((mod) => mod.JSDOM);
    }
    return jsdomPromise;
}

function lookupUuid(idToUuid, localId) {
    if (localId == null || localId === '') return undefined;
    if (idToUuid.has(localId)) return idToUuid.get(localId);
    const asNum = Number(localId);
    if (!Number.isNaN(asNum) && idToUuid.has(asNum)) return idToUuid.get(asNum);
    const asStr = String(localId);
    if (idToUuid.has(asStr)) return idToUuid.get(asStr);
    return undefined;
}

function rewriteElementAttrs(el, idToUuid) {
    const localId = el.hasAttribute('id') ? el.getAttribute('id') : null;
    const pathAttr = el.getAttribute('path');
    const uuid = lookupUuid(idToUuid, localId) ?? uuidFromRelPath(pathAttr);

    for (const attr of STRIP_ATTRS) {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
    }

    if (uuid) el.setAttribute('uuid', uuid);

    const name = el.getAttribute('name');
    const description = el.getAttribute('description');
    if (name == null) el.removeAttribute('name');
    if (description == null) el.removeAttribute('description');

    return uuid != null
        || localId != null
        || pathAttr != null
        || name != null
        || description != null;
}

export async function rewriteHtml(html, idToUuid) {
    if (!html || typeof html !== 'string') {
        return { html, changed: false };
    }
    if (!html.includes('data-type=')) {
        return { html, changed: false };
    }

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const tag of HTML_MEDIA_TYPES) {
        for (const el of doc.querySelectorAll(`[data-type="${tag}"]`)) {
            if (rewriteElementAttrs(el, idToUuid || new Map())) {
                changed = true;
            }
        }
    }

    return { html: changed ? doc.body.innerHTML : html, changed };
}
