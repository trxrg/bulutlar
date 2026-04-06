import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ArticleLink from './ArticleLinkExtension';
import RestrictedEditing from './RestrictedEditingPlugin';

describe('RestrictedEditingPlugin', () => {
    let editor;

    afterEach(() => {
        if (editor) editor.destroy();
    });

    const createEditor = (restricted, content = '<p>hello world</p>') => {
        editor = new Editor({
            extensions: [
                StarterKit,
                ArticleLink,
                RestrictedEditing.configure({ restricted }),
            ],
            content,
        });
        return editor;
    };

    // ==================== Unrestricted Mode ====================

    test('when not restricted, content insertion is allowed', () => {
        createEditor(false);
        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' beautiful');

        expect(editor.state.doc.textContent).toContain('beautiful');
    });

    test('when not restricted, content deletion is allowed', () => {
        createEditor(false);
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.deleteSelection();

        expect(editor.state.doc.textContent).not.toContain('hello');
    });

    // ==================== Restricted Mode: Blocked Operations ====================

    test('when restricted, content insertion is blocked', () => {
        createEditor(true);
        const textBefore = editor.state.doc.textContent;

        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' injected');

        expect(editor.state.doc.textContent).toBe(textBefore);
    });

    test('when restricted, content deletion is blocked', () => {
        createEditor(true);
        const textBefore = editor.state.doc.textContent;

        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.deleteSelection();

        expect(editor.state.doc.textContent).toBe(textBefore);
    });

    // ==================== Restricted Mode: Allowed Mark Operations ====================

    test('when restricted, adding a link mark is allowed', () => {
        createEditor(true);
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setArticleLink({ url: 'article:1' });

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.marks).toBeDefined();
        expect(node.marks[0].type).toBe('articleLink');
        expect(node.marks[0].attrs.url).toBe('article:1');
    });

    test('when restricted, removing a link mark is allowed', () => {
        createEditor(true, '<p><span class="link" data-url="article:1">hello</span> world</p>');
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.unsetArticleLink();

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.marks).toBeUndefined();
    });

    test('when restricted, toggling bold mark is allowed', () => {
        createEditor(true);
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.toggleBold();

        const json = editor.getJSON();
        const node = json.content[0].content[0];
        expect(node.marks).toBeDefined();
        expect(node.marks[0].type).toBe('bold');
    });

    // ==================== Dynamic Restriction Toggle ====================

    test('changing restricted via storage dynamically switches behavior', () => {
        createEditor(true);
        const textBefore = editor.state.doc.textContent;

        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' blocked');
        expect(editor.state.doc.textContent).toBe(textBefore);

        editor.storage.restrictedEditing.restricted = false;

        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' allowed');
        expect(editor.state.doc.textContent).toContain('allowed');
    });

    test('re-enabling restriction after disabling blocks edits again', () => {
        createEditor(false);

        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' first');
        expect(editor.state.doc.textContent).toContain('first');

        editor.storage.restrictedEditing.restricted = true;
        const textAfterRestriction = editor.state.doc.textContent;

        editor.commands.setTextSelection(6);
        editor.commands.insertContent(' second');
        expect(editor.state.doc.textContent).toBe(textAfterRestriction);
    });

    // ==================== Non-Document Transactions ====================

    test('selection changes are always allowed when restricted', () => {
        createEditor(true);
        const result = editor.commands.setTextSelection(3);
        expect(result).toBe(true);
        expect(editor.state.selection.from).toBe(3);
    });
});
