import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TiptapAudio from './TiptapAudio.jsx';

const AudioNode = Node.create({
    name: 'audioNode',
    group: 'block',
    atom: true,
    draggable: true,

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
        return [{ tag: 'div[data-type="audioNode"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'audioNode' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TiptapAudio);
    },
});

export default AudioNode;
