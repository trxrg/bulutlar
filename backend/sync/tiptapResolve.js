// Receiver-side inverse of tiptapRewrite.js.
//
// The exporter rewrites every imageNode / audioNode / videoNode in a tiptap
// doc down to { uuid, name?, description? } (see tiptapRewrite.js), dropping
// the desktop-local `id` / `path`. The desktop renderer, however, resolves
// embedded media by `attrs.id` (TiptapImage calls imageApi.getDataById). So
// on import we must walk the doc and turn each `uuid` back into the freshly
// inserted local row's { id, path, type, ... } — otherwise imported articles
// render with broken (id-less) media nodes.
//
// `mediaInfoByUuid` is Map<uuid, { id, name, type, path, size, description,
// duration?, width?, height? }> assembled by applyBundle as it inserts media.
// Each node is matched by uuid, uuid parsed from path, path, or id — then
// relinked to the local row. Unmatched nodes are left as-is.

import {
    buildMediaInfoLookupFromUuidMap,
    lookupMediaInfo,
    mediaInfoToTiptapAttrs,
} from './mediaRelink.js';

const MEDIA_NODE_TYPES = new Set(['imageNode', 'audioNode', 'videoNode']);

// Returns { doc, changed }. Never mutates the input doc.
export function resolveTiptapMedia(doc, mediaInfoByUuid) {
    if (doc == null) return { doc, changed: false };
    const lookup = buildMediaInfoLookupFromUuidMap(mediaInfoByUuid);
    return relinkTiptapMediaWithLookup(doc, lookup);
}

function relinkTiptapMediaWithLookup(doc, lookup) {
    const state = { changed: false };
    const out = resolveNode(doc, lookup, state);
    return { doc: out, changed: state.changed };
}

// Walks `doc` and adds every media node's `attrs.uuid` into `set`.
export function collectMediaUuids(doc, set) {
    if (doc == null || typeof doc !== 'object') return;
    if (Array.isArray(doc)) {
        for (const n of doc) collectMediaUuids(n, set);
        return;
    }
    if (typeof doc.type === 'string' && MEDIA_NODE_TYPES.has(doc.type)) {
        const uuid = doc.attrs && doc.attrs.uuid;
        if (uuid != null) set.add(uuid);
    }
    if (Array.isArray(doc.content)) {
        for (const c of doc.content) collectMediaUuids(c, set);
    }
}

// Removes every media node whose resolved local `attrs.id` is in `idSet`.
// Used after media reconciliation hard-deletes the rows a bundle no longer
// includes: a revision-gated (skipped) article/comment body still embeds
// those now-deleted attachments, and without this it would render broken
// placeholders. `idSet` should contain the deleted local ids in both
// number and string form (node attrs.id type is not guaranteed).
// Returns { doc, changed }; never mutates the input.
export function stripMediaNodesById(doc, idSet) {
    if (doc == null || !idSet || idSet.size === 0) return { doc, changed: false };
    const state = { changed: false };
    const out = stripById(doc, idSet, state);
    return { doc: out, changed: state.changed };
}

function stripById(node, idSet, state) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
        const kept = [];
        for (const child of node) {
            if (child && typeof child === 'object'
                && typeof child.type === 'string' && MEDIA_NODE_TYPES.has(child.type)
                && child.attrs && idSet.has(child.attrs.id)) {
                state.changed = true;
                continue; // drop the dangling media node
            }
            kept.push(stripById(child, idSet, state));
        }
        return kept;
    }
    const out = { ...node };
    if (Array.isArray(out.content)) out.content = stripById(out.content, idSet, state);
    return out;
}

function resolveNode(node, map, state) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map((n) => resolveNode(n, map, state));

    const out = { ...node };
    if (typeof out.type === 'string' && MEDIA_NODE_TYPES.has(out.type)) {
        out.attrs = resolveAttrs(out.attrs, map, state);
    }
    if (Array.isArray(out.content)) {
        out.content = out.content.map((c) => resolveNode(c, map, state));
    }
    return out;
}

function resolveAttrs(attrs, lookup, state) {
    if (attrs == null || typeof attrs !== 'object') return attrs;
    const info = lookupMediaInfo(attrs, lookup);
    if (!info) return attrs;

    const result = mediaInfoToTiptapAttrs(info, attrs);
    const keys = new Set([...Object.keys(attrs), ...Object.keys(result)]);
    for (const k of keys) {
        if (k === 'uuid') continue;
        if (attrs[k] !== result[k]) {
            state.changed = true;
            break;
        }
    }
    return result;
}
