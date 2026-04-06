import { Mark, mergeAttributes } from '@tiptap/core';

const ArticleQuote = Mark.create({
    name: 'articleQuote',

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'quote',
            },
        };
    },

    addAttributes() {
        return {
            annotationId: {
                default: null,
                parseHTML: element => {
                    const val = element.getAttribute('data-annotation-id');
                    return val ? Number(val) : null;
                },
                renderHTML: attributes => {
                    if (!attributes.annotationId) return {};
                    return { 'data-annotation-id': attributes.annotationId };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.quote[data-annotation-id]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setArticleQuote: (attributes) => ({ chain }) => {
                return chain().setMark(this.name, attributes).run();
            },
            unsetArticleQuote: () => ({ chain }) => {
                return chain().unsetMark(this.name).run();
            },
        };
    },
});

export default ArticleQuote;
