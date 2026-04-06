import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TiptapVideo from './TiptapVideo.jsx';

const VideoNode = Node.create({
    name: 'videoNode',
    group: 'block',
    atom: true,
    draggable: false,

    addAttributes() {
        return {
            id: { default: null },
            name: { default: null },
            type: { default: null },
            path: { default: null },
            size: { default: null },
            description: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="videoNode"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'videoNode' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TiptapVideo);
    },
});

export default VideoNode;
