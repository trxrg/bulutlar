import { Editor } from '@tiptap/core';
import { getMarkRange } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ArticleQuote from './ArticleQuoteExtension';

describe('ArticleQuoteExtension', () => {
    let editor;

    afterEach(() => {
        if (editor) editor.destroy();
    });

    const createEditor = (content = '<p>hello world</p>') => {
        editor = new Editor({
            extensions: [StarterKit, ArticleQuote],
            content,
        });
        return editor;
    };

    // ==================== Mark Application ====================

    test('setArticleQuote applies mark to selected text', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleQuote({ annotationId: 42 });

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.text).toBe('hello');
        expect(node.marks).toEqual([
            { type: 'articleQuote', attrs: { annotationId: 42 } },
        ]);
    });

    test('setArticleQuote does not affect unselected text', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleQuote({ annotationId: 1 });

        const json = editor.getJSON();
        const unmarked = json.content[0].content[1];
        expect(unmarked.text).toBe(' world');
        expect(unmarked.marks).toBeUndefined();
    });

    // ==================== Mark Removal ====================

    test('unsetArticleQuote removes mark from selected text', () => {
        createEditor('<p><span class="quote" data-annotation-id="1">quoted</span> text</p>');
        editor.commands.setTextSelection({ from: 1, to: 7 });
        editor.commands.unsetArticleQuote();

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.marks).toBeUndefined();
    });

    // ==================== HTML Rendering ====================

    test('renders with span.quote and data-annotation-id attribute', () => {
        createEditor();
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleQuote({ annotationId: 5 });

        const html = editor.getHTML();
        expect(html).toContain('class="quote"');
        expect(html).toContain('data-annotation-id="5"');
        expect(html).toMatch(/<span[^>]*class="quote"[^>]*>hello<\/span>/);
    });

    // ==================== HTML Parsing ====================

    test('parses quote mark from span.quote[data-annotation-id] HTML', () => {
        createEditor('<p><span class="quote" data-annotation-id="10">noted</span></p>');

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.text).toBe('noted');
        expect(node.marks).toEqual([
            { type: 'articleQuote', attrs: { annotationId: 10 } },
        ]);
    });

    test('annotationId is parsed as a number', () => {
        createEditor('<p><span class="quote" data-annotation-id="77">text</span></p>');

        const mark = editor.getJSON().content[0].content[0].marks[0];
        expect(mark.attrs.annotationId).toBe(77);
        expect(typeof mark.attrs.annotationId).toBe('number');
    });

    // ==================== Multiple Quotes ====================

    test('multiple quotes coexist in the same paragraph', () => {
        createEditor(
            '<p><span class="quote" data-annotation-id="1">first</span> and <span class="quote" data-annotation-id="2">second</span></p>'
        );

        const content = editor.getJSON().content[0].content;
        expect(content[0].text).toBe('first');
        expect(content[0].marks[0].attrs.annotationId).toBe(1);

        expect(content[1].text).toBe(' and ');
        expect(content[1].marks).toBeUndefined();

        expect(content[2].text).toBe('second');
        expect(content[2].marks[0].attrs.annotationId).toBe(2);
    });

    // ==================== JSON Roundtrip ====================

    test('annotationId attribute survives JSON roundtrip', () => {
        const inputJson = {
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{
                    type: 'text',
                    marks: [{ type: 'articleQuote', attrs: { annotationId: 99 } }],
                    text: 'roundtrip',
                }],
            }],
        };

        createEditor(inputJson);
        const output = editor.getJSON();
        const mark = output.content[0].content[0].marks[0];
        expect(mark.type).toBe('articleQuote');
        expect(mark.attrs.annotationId).toBe(99);
    });

    // ==================== Quote Removal with getMarkRange ====================

    test('getMarkRange returns correct range for a quote mark', () => {
        createEditor('<p><span class="quote" data-annotation-id="1">quoted text</span> normal</p>');

        const $pos = editor.state.doc.resolve(3);
        const range = getMarkRange($pos, editor.schema.marks.articleQuote);

        expect(range).toBeDefined();
        expect(range.from).toBe(1);
        expect(range.to).toBe(12);
    });

    test('selecting full mark range and unsetting removes the quote entirely', () => {
        createEditor('<p><span class="quote" data-annotation-id="1">quoted text</span> normal</p>');

        const $pos = editor.state.doc.resolve(3);
        const range = getMarkRange($pos, editor.schema.marks.articleQuote);

        editor.chain()
            .setTextSelection({ from: range.from, to: range.to })
            .unsetArticleQuote()
            .run();

        const json = editor.getJSON();
        json.content[0].content.forEach(node => {
            const hasQuote = node.marks?.some(m => m.type === 'articleQuote');
            expect(hasQuote).toBeFalsy();
        });
    });

    test('removing one quote does not affect adjacent quotes', () => {
        createEditor(
            '<p><span class="quote" data-annotation-id="1">first</span> and <span class="quote" data-annotation-id="2">second</span></p>'
        );

        const $pos = editor.state.doc.resolve(2);
        const range = getMarkRange($pos, editor.schema.marks.articleQuote);

        editor.chain()
            .setTextSelection({ from: range.from, to: range.to })
            .unsetArticleQuote()
            .run();

        const content = editor.getJSON().content[0].content;

        expect(content[0].text).toBe('first and ');
        expect(content[0].marks).toBeUndefined();

        expect(content[1].text).toBe('second');
        expect(content[1].marks).toBeDefined();
        expect(content[1].marks[0].attrs.annotationId).toBe(2);
    });

    // ==================== Cross-Block Removal ====================

    test('removeMark via descendants removes quote across multiple paragraphs', () => {
        createEditor(
            '<p><span class="quote" data-annotation-id="5">first paragraph</span></p>' +
            '<p><span class="quote" data-annotation-id="5">second paragraph</span></p>'
        );

        const annotationId = 5;
        const markType = editor.schema.marks.articleQuote;
        const tr = editor.state.tr;

        editor.state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
                m => m.type === markType && m.attrs.annotationId === annotationId
            );
            if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark);
            }
        });
        editor.view.dispatch(tr);

        const json = editor.getJSON();
        json.content.forEach(paragraph => {
            paragraph.content.forEach(node => {
                const hasQuote = node.marks?.some(m => m.type === 'articleQuote');
                expect(hasQuote).toBeFalsy();
            });
        });
    });

    test('cross-block removal only removes matching annotationId', () => {
        createEditor(
            '<p><span class="quote" data-annotation-id="5">remove me</span></p>' +
            '<p><span class="quote" data-annotation-id="5">and me</span></p>' +
            '<p><span class="quote" data-annotation-id="9">keep me</span></p>'
        );

        const annotationId = 5;
        const markType = editor.schema.marks.articleQuote;
        const tr = editor.state.tr;

        editor.state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
                m => m.type === markType && m.attrs.annotationId === annotationId
            );
            if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark);
            }
        });
        editor.view.dispatch(tr);

        const json = editor.getJSON();

        // First two paragraphs should have no quote marks
        expect(json.content[0].content[0].marks).toBeUndefined();
        expect(json.content[1].content[0].marks).toBeUndefined();

        // Third paragraph should still have its quote
        expect(json.content[2].content[0].marks).toBeDefined();
        expect(json.content[2].content[0].marks[0].attrs.annotationId).toBe(9);
    });

    // ==================== Edge Cases ====================

    test('quote mark can coexist with bold mark', () => {
        createEditor('<p><strong><span class="quote" data-annotation-id="1">bold quote</span></strong></p>');

        const node = editor.getJSON().content[0].content[0];
        const markTypes = node.marks.map(m => m.type).sort();
        expect(markTypes).toContain('articleQuote');
        expect(markTypes).toContain('bold');
    });

    test('setArticleQuote on collapsed selection does not crash', () => {
        createEditor();
        editor.commands.setTextSelection(3);
        expect(() => {
            editor.commands.setArticleQuote({ annotationId: 1 });
        }).not.toThrow();
    });
});
