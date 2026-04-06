import { Editor } from '@tiptap/core';
import { getMarkRange } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ArticleLink from './ArticleLinkExtension';

describe('ArticleLinkExtension', () => {
    let editor;

    afterEach(() => {
        if (editor) editor.destroy();
    });

    const createEditor = (content = '<p>hello world</p>') => {
        editor = new Editor({
            extensions: [StarterKit, ArticleLink],
            content,
        });
        return editor;
    };

    // ==================== Mark Application ====================

    test('setArticleLink applies mark to selected text', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleLink({ url: 'article:42' });

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.text).toBe('hello');
        expect(node.marks).toEqual([
            { type: 'articleLink', attrs: { url: 'article:42' } },
        ]);
    });

    test('setArticleLink does not affect unselected text', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleLink({ url: 'article:1' });

        const json = editor.getJSON();
        const unmarked = json.content[0].content[1];
        expect(unmarked.text).toBe(' world');
        expect(unmarked.marks).toBeUndefined();
    });

    // ==================== Mark Removal ====================

    test('unsetArticleLink removes mark from selected text', () => {
        createEditor('<p><span class="link" data-url="article:1">linked</span> text</p>');
        editor.commands.setTextSelection({ from: 1, to: 7 });
        editor.commands.unsetArticleLink();

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.marks).toBeUndefined();
    });

    // ==================== HTML Rendering ====================

    test('renders with span.link and data-url attribute', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleLink({ url: 'article:5' });

        const html = editor.getHTML();
        expect(html).toContain('class="link"');
        expect(html).toContain('data-url="article:5"');
        expect(html).toMatch(/<span[^>]*class="link"[^>]*>hello<\/span>/);
    });

    // ==================== HTML Parsing ====================

    test('parses link mark from span.link[data-url] HTML', () => {
        createEditor('<p><span class="link" data-url="article:10">click me</span></p>');

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.text).toBe('click me');
        expect(node.marks).toEqual([
            { type: 'articleLink', attrs: { url: 'article:10' } },
        ]);
    });

    // ==================== Multiple Links ====================

    test('multiple links coexist in the same paragraph', () => {
        createEditor(
            '<p><span class="link" data-url="article:1">first</span> and <span class="link" data-url="article:2">second</span></p>'
        );

        const content = editor.getJSON().content[0].content;
        expect(content[0].text).toBe('first');
        expect(content[0].marks[0].attrs.url).toBe('article:1');

        expect(content[1].text).toBe(' and ');
        expect(content[1].marks).toBeUndefined();

        expect(content[2].text).toBe('second');
        expect(content[2].marks[0].attrs.url).toBe('article:2');
    });

    // ==================== JSON Roundtrip ====================

    test('url attribute survives JSON roundtrip', () => {
        const inputJson = {
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{
                    type: 'text',
                    marks: [{ type: 'articleLink', attrs: { url: 'article:99' } }],
                    text: 'roundtrip',
                }],
            }],
        };

        createEditor(inputJson);
        const output = editor.getJSON();
        const mark = output.content[0].content[0].marks[0];
        expect(mark.type).toBe('articleLink');
        expect(mark.attrs.url).toBe('article:99');
    });

    // ==================== Link Removal with getMarkRange ====================

    test('getMarkRange returns correct range for a link mark', () => {
        createEditor('<p><span class="link" data-url="article:1">linked text</span> normal</p>');

        const $pos = editor.state.doc.resolve(3);
        const range = getMarkRange($pos, editor.schema.marks.articleLink);

        expect(range).toBeDefined();
        expect(range.from).toBe(1);
        expect(range.to).toBe(12);
    });

    test('selecting full mark range and unsetting removes the link entirely', () => {
        createEditor('<p><span class="link" data-url="article:1">linked text</span> normal</p>');

        const $pos = editor.state.doc.resolve(3);
        const range = getMarkRange($pos, editor.schema.marks.articleLink);

        editor.chain()
            .setTextSelection({ from: range.from, to: range.to })
            .unsetArticleLink()
            .run();

        const json = editor.getJSON();
        json.content[0].content.forEach(node => {
            const hasLink = node.marks?.some(m => m.type === 'articleLink');
            expect(hasLink).toBeFalsy();
        });
    });

    test('removing one link does not affect adjacent links', () => {
        createEditor(
            '<p><span class="link" data-url="article:1">first</span> and <span class="link" data-url="article:2">second</span></p>'
        );

        const $pos = editor.state.doc.resolve(2);
        const range = getMarkRange($pos, editor.schema.marks.articleLink);

        editor.chain()
            .setTextSelection({ from: range.from, to: range.to })
            .unsetArticleLink()
            .run();

        const content = editor.getJSON().content[0].content;

        // "first" and " and " merge into one unmarked node (ProseMirror merges adjacent same-mark nodes)
        expect(content[0].text).toBe('first and ');
        expect(content[0].marks).toBeUndefined();

        // The second link remains intact
        expect(content[1].text).toBe('second');
        expect(content[1].marks).toBeDefined();
        expect(content[1].marks[0].attrs.url).toBe('article:2');
    });

    // ==================== Edge Cases ====================

    test('link mark can coexist with bold mark', () => {
        createEditor('<p><strong><span class="link" data-url="article:1">bold link</span></strong></p>');

        const node = editor.getJSON().content[0].content[0];
        const markTypes = node.marks.map(m => m.type).sort();
        expect(markTypes).toContain('articleLink');
        expect(markTypes).toContain('bold');
    });

    test('setArticleLink on collapsed selection does not crash', () => {
        createEditor();
        editor.commands.setTextSelection(3);
        expect(() => {
            editor.commands.setArticleLink({ url: 'article:1' });
        }).not.toThrow();
    });
});
