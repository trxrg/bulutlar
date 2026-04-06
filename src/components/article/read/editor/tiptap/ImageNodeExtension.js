import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TiptapImage from './TiptapImage.jsx';

const ImageNode = Node.create({
    name: 'imageNode',
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
        return [{ tag: 'div[data-type="imageNode"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'imageNode' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TiptapImage);
    },
});

export default ImageNode;
