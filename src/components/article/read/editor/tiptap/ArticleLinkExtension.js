import { Mark, mergeAttributes } from '@tiptap/core';

const ArticleLink = Mark.create({
    name: 'articleLink',

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'link',
            },
        };
    },

    addAttributes() {
        return {
            url: {
                default: null,
                parseHTML: element => element.getAttribute('data-url'),
                renderHTML: attributes => {
                    if (!attributes.url) return {};
                    return { 'data-url': attributes.url };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.link[data-url]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setArticleLink: (attributes) => ({ chain }) => {
                return chain().setMark(this.name, attributes).run();
            },
            unsetArticleLink: () => ({ chain }) => {
                return chain().unsetMark(this.name).run();
            },
        };
    },
});

export default ArticleLink;
