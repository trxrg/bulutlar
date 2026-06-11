// Receiver-side HTML inverse of tiptapResolve.js.
//
// Walks embedded media elements in an HTML string and re-links each one to
// the freshly inserted local media row via `mediaInfoByUuid`. The desktop
// renderer resolves media by `id`; imported HTML still carries the exporter's
// local id until this pass runs.

import {
    buildMediaInfoLookupFromUuidMap,
    relinkHtmlMedia as relinkHtmlMediaWithLookup,
} from './mediaRelink.js';

const HTML_MEDIA_TYPES = ['imageNode', 'audioNode', 'videoNode'];

let jsdomPromise = null;
function getJSDOM() {
    if (!jsdomPromise) {
        jsdomPromise = import('jsdom').then((mod) => mod.JSDOM);
    }
    return jsdomPromise;
}

// Returns { html, changed }. Never mutates the input string.
export async function resolveHtmlMedia(html, mediaInfoByUuid) {
    if (!html || typeof html !== 'string' || !mediaInfoByUuid || mediaInfoByUuid.size === 0) {
        return { html, changed: false };
    }
    const lookup = buildMediaInfoLookupFromUuidMap(mediaInfoByUuid);
    return relinkHtmlMediaWithLookup(html, lookup);
}

function idInSet(idSet, idAttr) {
    if (idAttr == null || idAttr === '') return false;
    if (idSet.has(idAttr)) return true;
    const asNum = Number(idAttr);
    if (!Number.isNaN(asNum) && idSet.has(asNum)) return true;
    return idSet.has(String(idAttr));
}

// Removes HTML media elements whose `id` attribute matches a deleted local
// media row. Returns { html, changed }; never mutates the input string.
export async function stripHtmlMediaById(html, idSet) {
    if (!html || typeof html !== 'string' || !idSet || idSet.size === 0) {
        return { html, changed: false };
    }
    if (!html.includes('data-type=')) return { html, changed: false };

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const tag of HTML_MEDIA_TYPES) {
        for (const el of [...doc.querySelectorAll(`[data-type="${tag}"]`)]) {
            if (idInSet(idSet, el.getAttribute('id'))) {
                el.remove();
                changed = true;
            }
        }
    }

    return { html: changed ? doc.body.innerHTML : html, changed };
}
