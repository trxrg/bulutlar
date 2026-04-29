// Phase 3: rewrite tiptap doc nodes for the on-disk wire format.
//
// Walks a tiptap doc tree (recursive over `content`) and for any node
// whose `type` matches `imageNode` / `audioNode` / `videoNode`, replaces
// `attrs` with the TiptapMediaNodeAttrs shape locked in
// `backend/sync/types.js`:
//
//     { uuid, name?, description? }
//
// Drops the original `id`, `path`, `type`, `size` (Q4 / §3e). The `id`
// is desktop-local; `path` leaks the desktop's filesystem layout and is
// wrong on mobile; `type` and `size` are recomputable on the receiver.
//
// `idToUuid` is a Map<localId, uuid> built by the caller from the
// article's media rows. If a node references an `id` not present in the
// map (or `attrs.id` is missing), the node is left intact except for the
// stripped fields — better than emitting a broken reference, since the
// receiver can still see the display fallback.
//
// Returns a new tree; does NOT mutate the input. The desktop's live
// tiptap JSON columns must stay unchanged so the local renderer keeps
// working.

const MEDIA_NODE_TYPES = new Set(['imageNode', 'audioNode', 'videoNode']);

export function rewriteTiptap(doc, idToUuid) {
    if (doc == null) return doc;
    return rewriteNode(doc, idToUuid);
}

function rewriteNode(node, idToUuid) {
    if (node == null || typeof node !== 'object') return node;

    if (Array.isArray(node)) {
        return node.map((n) => rewriteNode(n, idToUuid));
    }

    const out = { ...node };

    if (typeof out.type === 'string' && MEDIA_NODE_TYPES.has(out.type)) {
        out.attrs = rewriteMediaAttrs(out.attrs, idToUuid);
    }

    if (Array.isArray(out.content)) {
        out.content = out.content.map((child) => rewriteNode(child, idToUuid));
    }

    return out;
}

function rewriteMediaAttrs(attrs, idToUuid) {
    if (attrs == null || typeof attrs !== 'object') return attrs;

    const localId = attrs.id;
    const uuid = localId != null ? idToUuid.get(localId) : undefined;

    const result = {};
    if (uuid) result.uuid = uuid;
    if (attrs.name != null) result.name = attrs.name;
    if (attrs.description != null) result.description = attrs.description;
    return result;
}
