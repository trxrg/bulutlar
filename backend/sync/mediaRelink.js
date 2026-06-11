// Relinks embedded media nodes in HTML / TipTap JSON to authoritative DB rows.
//
// Lookup order per node: `uuid` attr → uuid parsed from `path` → `path` → `id`.
// Used by the one-shot id-relink migration and by BLT import resolve passes.

import { uuidFromRelPath } from './mediaPath.js';

const MEDIA_NODE_TYPES = new Set(['imageNode', 'audioNode', 'videoNode']);
const HTML_MEDIA_TYPES = ['imageNode', 'audioNode', 'videoNode'];

export function rowToMediaInfo(row) {
    return {
        id: row.id,
        uuid: row.uuid != null ? row.uuid : null,
        name: row.name,
        type: row.type,
        path: row.path,
        size: row.size != null ? row.size : null,
        description: row.description != null ? row.description : null,
        duration: row.duration != null ? row.duration : null,
        width: row.width != null ? row.width : null,
        height: row.height != null ? row.height : null,
    };
}

export function buildMediaInfoLookup(rows) {
    const byUuid = new Map();
    const byPath = new Map();
    const byId = new Map();

    for (const row of rows) {
        const info = rowToMediaInfo(row);
        if (info.uuid) byUuid.set(info.uuid, info);
        if (info.path) byPath.set(info.path, info);
        if (info.id != null) {
            byId.set(info.id, info);
            byId.set(String(info.id), info);
        }
    }

    return { byUuid, byPath, byId };
}

export function buildMediaInfoLookupFromUuidMap(mediaInfoByUuid) {
    const rows = [];
    for (const [uuid, info] of mediaInfoByUuid) {
        rows.push({ ...info, uuid });
    }
    return buildMediaInfoLookup(rows);
}

export function lookupMediaInfo(attrs, lookup) {
    if (attrs == null || lookup == null) return null;

    if (attrs.uuid != null && lookup.byUuid.has(attrs.uuid)) {
        return lookup.byUuid.get(attrs.uuid);
    }

    const pathUuid = uuidFromRelPath(attrs.path);
    if (pathUuid != null && lookup.byUuid.has(pathUuid)) {
        return lookup.byUuid.get(pathUuid);
    }

    if (attrs.path != null && lookup.byPath.has(attrs.path)) {
        return lookup.byPath.get(attrs.path);
    }

    if (attrs.id != null) {
        if (lookup.byId.has(attrs.id)) return lookup.byId.get(attrs.id);
        if (lookup.byId.has(String(attrs.id))) return lookup.byId.get(String(attrs.id));
    }

    return null;
}

export function mediaInfoToTiptapAttrs(info, existingAttrs = {}) {
    const result = {
        id: info.id,
        name: info.name != null ? info.name : (existingAttrs.name != null ? existingAttrs.name : null),
        type: info.type != null ? info.type : null,
        path: info.path != null ? info.path : null,
        size: info.size != null ? info.size : null,
        description: info.description != null
            ? info.description
            : (existingAttrs.description != null ? existingAttrs.description : null),
    };
    if (info.duration != null) result.duration = info.duration;
    if (info.width != null) result.width = info.width;
    if (info.height != null) result.height = info.height;
    return result;
}

function tiptapAttrsDiffer(before, after) {
    if (before == null || after == null) return before !== after;
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const k of keys) {
        if (k === 'uuid') continue;
        if (before[k] !== after[k]) return true;
    }
    return false;
}

// Returns { doc, changed }; never mutates the input.
export function relinkTiptapMedia(doc, lookup) {
    if (doc == null || !lookup) return { doc, changed: false };
    const state = { changed: false };
    const out = relinkTiptapNode(doc, lookup, state);
    return { doc: out, changed: state.changed };
}

function relinkTiptapNode(node, lookup, state) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map((n) => relinkTiptapNode(n, lookup, state));

    const out = { ...node };
    if (typeof out.type === 'string' && MEDIA_NODE_TYPES.has(out.type)) {
        const info = lookupMediaInfo(out.attrs, lookup);
        if (info) {
            const nextAttrs = mediaInfoToTiptapAttrs(info, out.attrs);
            if (tiptapAttrsDiffer(out.attrs, nextAttrs)) {
                out.attrs = nextAttrs;
                state.changed = true;
            }
        }
    }
    if (Array.isArray(out.content)) {
        out.content = out.content.map((c) => relinkTiptapNode(c, lookup, state));
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

function applyMediaInfoToElement(el, info) {
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

function elementAttrsFromDom(el) {
    return {
        id: el.hasAttribute('id') ? el.getAttribute('id') : null,
        uuid: el.getAttribute('uuid'),
        path: el.getAttribute('path'),
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        size: el.hasAttribute('size') ? el.getAttribute('size') : null,
        description: el.getAttribute('description'),
    };
}

function htmlElementNeedsRelink(el, info) {
    if (String(el.getAttribute('id')) !== String(info.id)) return true;
    if (info.path != null && el.getAttribute('path') !== info.path) return true;
    return false;
}

// Returns { html, changed }; never mutates the input string.
export async function relinkHtmlMedia(html, lookup) {
    if (!html || typeof html !== 'string' || !lookup) {
        return { html, changed: false };
    }
    if (!html.includes('data-type=')) return { html, changed: false };

    const JSDOM = await getJSDOM();
    const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
    const doc = dom.window.document;
    let changed = false;

    for (const tag of HTML_MEDIA_TYPES) {
        for (const el of doc.querySelectorAll(`[data-type="${tag}"]`)) {
            const info = lookupMediaInfo(elementAttrsFromDom(el), lookup);
            if (!info) continue;
            if (!htmlElementNeedsRelink(el, info)) continue;
            applyMediaInfoToElement(el, info);
            changed = true;
        }
    }

    return { html: changed ? doc.body.innerHTML : html, changed };
}
