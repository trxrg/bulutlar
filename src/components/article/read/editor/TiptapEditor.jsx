import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getMarkRange } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import { imageApi, audioApi, videoApi, articleApi, annotationApi } from '../../../../backend-adapter/BackendAdapter';
import { ReadContext } from '../../../../store/read-context';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import ArticleLink from './tiptap/ArticleLinkExtension';
import ArticleQuote from './tiptap/ArticleQuoteExtension';
import ImageNode from './tiptap/ImageNodeExtension';
import AudioNode from './tiptap/AudioNodeExtension';
import VideoNode from './tiptap/VideoNodeExtension';
import SearchHighlight from './tiptap/SearchHighlightPlugin';
import RestrictedEditing from './tiptap/RestrictedEditingPlugin';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ArticleInfo from '../../ArticleInfo';
import toastr from 'toastr';
import '../../../../styles.css';

const HIGHLIGHT_COLORS = {
    'HIGHLIGHT': 'var(--highlight-bg)',
    'HIGHLIGHT_GREEN': 'var(--highlight-green-bg)',
    'HIGHLIGHT_BLUE': 'var(--highlight-blue-bg)',
    'HIGHLIGHT_PINK': 'var(--highlight-pink-bg)',
};

function findLinkMarkAtEvent(view, event) {
    const coords = { left: event.clientX, top: event.clientY };
    const pos = view.posAtCoords(coords);
    if (!pos) return null;
    const $pos = view.state.doc.resolve(pos.pos);
    const marks = $pos.marks();
    const linkMark = marks.find(m => m.type.name === 'articleLink');
    if (!linkMark || !linkMark.attrs.url) return null;
    return { url: linkMark.attrs.url, pos: pos.pos };
}

function findQuoteMarkAtEvent(view, event) {
    const coords = { left: event.clientX, top: event.clientY };
    const pos = view.posAtCoords(coords);
    if (!pos) return null;
    const $pos = view.state.doc.resolve(pos.pos);
    const marks = $pos.marks();
    const quoteMark = marks.find(m => m.type.name === 'articleQuote');
    if (!quoteMark || !quoteMark.attrs.annotationId) return null;
    return { annotationId: quoteMark.attrs.annotationId, pos: pos.pos };
}

const TiptapEditor = React.forwardRef(({ prompt, htmlContent, rawContent, handleContentChange, editable, editorId = 'default' }, ref) => {

    const { setContextMenuIsOpen, setContextMenuPosition, searchTerm, articleId, updateAllHighlightRefs, currentHighlightIndex, allHighlightRefs } = useContext(ReadContext);
    const { translate: t, handleAddTab } = useContext(AppContext);
    const { fetchAllAnnotations, fetchArticleById, getArticleById } = useContext(DBContext);

    const [addedImageIdsWhileEditing, setAddedImageIdsWhileEditing] = useState([]);
    const [deletedImageIdsWhileEditing, setDeletedImageIdsWhileEditing] = useState([]);
    const [addedAudioIdsWhileEditing, setAddedAudioIdsWhileEditing] = useState([]);
    const [deletedAudioIdsWhileEditing, setDeletedAudioIdsWhileEditing] = useState([]);
    const [addedVideoIdsWhileEditing, setAddedVideoIdsWhileEditing] = useState([]);
    const [deletedVideoIdsWhileEditing, setDeletedVideoIdsWhileEditing] = useState([]);

    const [linkHover, setLinkHover] = useState(null);
    const [linkContextMenu, setLinkContextMenu] = useState(null);
    const [quoteContextMenu, setQuoteContextMenu] = useState(null);

    const initErrorRef = useRef(null);
    const originalContentRef = useRef(null);
    const lastDispatchedActiveIndexRef = useRef(-1);

    const handleDeleteMedia = useCallback((mediaId, mediaType) => {
        if (mediaType === 'IMAGE') {
            setDeletedImageIdsWhileEditing(prev => [...prev, mediaId]);
        } else if (mediaType === 'AUDIO') {
            setDeletedAudioIdsWhileEditing(prev => [...prev, mediaId]);
        } else if (mediaType === 'VIDEO') {
            setDeletedVideoIdsWhileEditing(prev => [...prev, mediaId]);
        }
    }, []);

    const getInitialContent = () => {
        try {
            if (rawContent && rawContent.type === 'doc') {
                return rawContent;
            }
            if (htmlContent) {
                return htmlContent;
            }
            return '';
        } catch (error) {
            console.error('Failed to initialize editor content:', error);
            initErrorRef.current = error;
            return '';
        }
    };

    const initialContent = getInitialContent();
    originalContentRef.current = initialContent;

    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight.configure({ multicolor: true }),
            Superscript,
            Subscript,
            Placeholder.configure({ placeholder: prompt || '' }),
            ArticleLink,
            ArticleQuote,
            ImageNode.configure({ onDeleteMedia: handleDeleteMedia }),
            AudioNode.configure({ onDeleteMedia: handleDeleteMedia }),
            VideoNode.configure({ onDeleteMedia: handleDeleteMedia }),
            SearchHighlight,
            RestrictedEditing.configure({ restricted: !editable }),
        ],
        content: initialContent,
        editable: true,
        editorProps: {
            attributes: {
                spellcheck: 'false',
            },
            handleClick: (view, pos, event) => {
                if (event.button !== 0) return false;

                const $pos = view.state.doc.resolve(pos);
                const marks = $pos.marks();
                const linkMark = marks.find(m => m.type.name === 'articleLink');
                if (linkMark && linkMark.attrs.url) {
                    const url = linkMark.attrs.url;
                    if (url.startsWith('article:')) {
                        const id = parseInt(url.substring(8));
                        const article = getArticleById(id);
                        if (article) {
                            handleAddTab(event, article.id);
                        } else {
                            toastr.warning(t('link not found'));
                        }
                        return true;
                    }
                }
                return false;
            },
            handleDOMEvents: {
                mousedown: (view, event) => {
                    if (event.button === 1) {
                        event.preventDefault();
                        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        if (coords) {
                            const $pos = view.state.doc.resolve(coords.pos);
                            const marks = $pos.marks();
                            const linkMark = marks.find(m => m.type.name === 'articleLink');
                            if (linkMark && linkMark.attrs.url) {
                                const url = linkMark.attrs.url;
                                if (url.startsWith('article:')) {
                                    const id = parseInt(url.substring(8));
                                    const article = getArticleById(id);
                                    if (article) {
                                        handleAddTab({ ctrlKey: true }, article.id);
                                    } else {
                                        toastr.warning(t('link not found'));
                                    }
                                }
                            }
                        }
                    }
                    return false;
                },
                mouseover: (view, event) => {
                    const target = event.target;
                    if (target.closest && target.closest('span.link[data-url]')) {
                        const span = target.closest('span.link[data-url]');
                        const url = span.getAttribute('data-url');
                        if (url && url.startsWith('article:')) {
                            const id = parseInt(url.substring(8));
                            const article = getArticleById(id);
                            if (article) {
                                const rect = span.getBoundingClientRect();
                                let x = rect.left;
                                const y = rect.bottom;
                                const estimatedMenuWidth = 300;
                                if (x + estimatedMenuWidth > window.innerWidth) {
                                    x = Math.max(10, window.innerWidth - estimatedMenuWidth - 10);
                                }
                                setLinkHover({ article, position: { top: y, left: x } });
                            }
                        }
                    }
                    return false;
                },
                mouseout: (view, event) => {
                    const target = event.target;
                    if (target.closest && target.closest('span.link[data-url]')) {
                        const related = event.relatedTarget;
                        if (!related || !related.closest || !related.closest('span.link[data-url]')) {
                            setLinkHover(null);
                        }
                    }
                    return false;
                },
                contextmenu: (view, event) => {
                    const linkInfo = findLinkMarkAtEvent(view, event);
                    if (linkInfo) {
                        event.preventDefault();
                        setLinkContextMenu({
                            url: linkInfo.url,
                            pos: linkInfo.pos,
                            position: { top: event.clientY, left: event.clientX },
                        });
                        return true;
                    }
                    const quoteInfo = findQuoteMarkAtEvent(view, event);
                    if (quoteInfo) {
                        event.preventDefault();
                        setQuoteContextMenu({
                            annotationId: quoteInfo.annotationId,
                            pos: quoteInfo.pos,
                            position: { top: event.clientY, left: event.clientX },
                        });
                        return true;
                    }
                    return false;
                },
            },
            handleKeyDown: (view, event) => {
                if (!editable) {
                    const isCtrlOrCmd = event.metaKey || event.ctrlKey;
                    const allowedKeys = ['c', 'a', 'f', 'F'];
                    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];

                    if (isCtrlOrCmd && allowedKeys.includes(event.key)) return false;
                    if (navigationKeys.includes(event.key)) return false;

                    return true;
                }
                return false;
            },
            handlePaste: () => {
                if (!editable) return true;
                return false;
            },
            handleDrop: () => {
                if (!editable) return true;
                return false;
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.storage.restrictedEditing.restricted = !editable;
    }, [editable, editor]);

    // Push search term into the extension
    useEffect(() => {
        if (editor) {
            editor.commands.setSearchTerm(searchTerm || '');
        }
    }, [searchTerm, editor]);

    // Tell the ProseMirror plugin which decoration is the active highlight
    useEffect(() => {
        if (!editor) return;
        let newLocalIndex = -1;
        if (currentHighlightIndex >= 0 && allHighlightRefs.length > 0) {
            const activeRef = allHighlightRefs[currentHighlightIndex];
            if (activeRef && activeRef.editorId === editorId) {
                newLocalIndex = 0;
                for (let i = 0; i < currentHighlightIndex; i++) {
                    if (allHighlightRefs[i].editorId === editorId) {
                        newLocalIndex++;
                    }
                }
            }
        }
        if (newLocalIndex !== lastDispatchedActiveIndexRef.current) {
            lastDispatchedActiveIndexRef.current = newLocalIndex;
            editor.commands.setActiveHighlightIndex(newLocalIndex);
        }
    }, [currentHighlightIndex, allHighlightRefs, editor, editorId]);

    // Collect search highlight DOM refs after decorations render
    useEffect(() => {
        if (!editor) return;

        let pendingTimeout = null;

        const collectHighlightRefs = () => {
            if (pendingTimeout) clearTimeout(pendingTimeout);

            if (!searchTerm) {
                updateAllHighlightRefs(editorId, []);
                return;
            }

            pendingTimeout = setTimeout(() => {
                const editorDom = editor.view.dom;
                const highlightSpans = editorDom.querySelectorAll('.search-highlight');
                const refs = Array.from(highlightSpans).map((span, index) => ({
                    offsetKey: `${editorId}-${index}`,
                    ref: span,
                }));
                updateAllHighlightRefs(editorId, refs);
            }, 50);
        };

        collectHighlightRefs();

        const onTransaction = ({ transaction }) => {
            if (transaction.docChanged) {
                collectHighlightRefs();
            }
        };

        editor.on('transaction', onTransaction);
        return () => {
            if (pendingTimeout) clearTimeout(pendingTimeout);
            editor.off('transaction', onTransaction);
        };
    }, [searchTerm, editor, editorId, updateAllHighlightRefs]);

    const persist = useCallback(() => {
        if (!editor) return;
        handleContentChange(editor.getHTML(), null, editor.getJSON());
    }, [editor, handleContentChange]);

    // ================================ LINKS ================================
    const addLink = useCallback((url) => {
        if (!editor) return;
        editor.chain().focus().setArticleLink({ url }).run();
        persist();
    }, [editor, persist]);

    const handleRemoveLink = useCallback(() => {
        if (!editor || !linkContextMenu) return;
        const { pos } = linkContextMenu;
        const $pos = editor.state.doc.resolve(pos);
        const range = getMarkRange($pos, editor.schema.marks.articleLink);
        if (!range) return;
        editor.chain().focus().setTextSelection({ from: range.from, to: range.to }).unsetArticleLink().run();
        setLinkContextMenu(null);
        persist();
    }, [editor, linkContextMenu, persist]);

    const handleRemoveQuote = useCallback(async () => {
        if (!editor || !quoteContextMenu) return;
        const { annotationId } = quoteContextMenu;
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

        setQuoteContextMenu(null);
        persist();

        try {
            await annotationApi.deleteById(annotationId);
            await fetchAllAnnotations();
        } catch (error) {
            console.error('Error deleting annotation from db:', error);
        }
    }, [editor, quoteContextMenu, persist, fetchAllAnnotations]);

    // ================================ QUOTES ================================
    const addQuote = useCallback(async () => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        if (from === to) return;

        const selectedText = editor.state.doc.textBetween(from, to, '\n');
        if (!selectedText || !selectedText.trim()) return;

        let annotation = { note: '', quote: selectedText };

        try {
            annotation = await articleApi.addAnnotation(articleId, annotation);
            await fetchAllAnnotations();
            await fetchArticleById(articleId);
            toastr.success(t('quote added'));
        } catch (e) {
            toastr.error(e.message, t('error adding quote'));
            return;
        }

        if (!annotation || !annotation.id) {
            toastr.error(t('error adding quote'));
            return;
        }

        editor.chain().focus().setArticleQuote({ annotationId: annotation.id }).run();
        persist();
    }, [editor, articleId, fetchAllAnnotations, fetchArticleById, t, persist]);

    // ================================ MEDIA ================================
    const addImage = useCallback((image) => {
        if (!editor) return;
        editor.chain().focus().insertContent({ type: 'imageNode', attrs: image }).run();
        setAddedImageIdsWhileEditing(prev => [...prev, image.id]);
    }, [editor]);

    const addAudio = useCallback((audio) => {
        if (!editor) return;
        editor.chain().focus().insertContent({ type: 'audioNode', attrs: audio }).run();
        setAddedAudioIdsWhileEditing(prev => [...prev, audio.id]);
    }, [editor]);

    const addVideo = useCallback((video) => {
        if (!editor) return;
        editor.chain().focus().insertContent({ type: 'videoNode', attrs: video }).run();
        setAddedVideoIdsWhileEditing(prev => [...prev, video.id]);
    }, [editor]);

    // ================================ STYLE TOGGLES ================================
    const toggleInlineStyle = useCallback((style) => {
        if (!editor) return;

        const chain = editor.chain().focus();
        switch (style) {
            case 'BOLD': chain.toggleBold().run(); break;
            case 'ITALIC': chain.toggleItalic().run(); break;
            case 'UNDERLINE': chain.toggleUnderline().run(); break;
            case 'HIGHLIGHT': chain.toggleHighlight({ color: HIGHLIGHT_COLORS.HIGHLIGHT }).run(); break;
            case 'HIGHLIGHT_GREEN': chain.toggleHighlight({ color: HIGHLIGHT_COLORS.HIGHLIGHT_GREEN }).run(); break;
            case 'HIGHLIGHT_BLUE': chain.toggleHighlight({ color: HIGHLIGHT_COLORS.HIGHLIGHT_BLUE }).run(); break;
            case 'HIGHLIGHT_PINK': chain.toggleHighlight({ color: HIGHLIGHT_COLORS.HIGHLIGHT_PINK }).run(); break;
            case 'SUPERSCRIPT': chain.toggleSuperscript().run(); break;
            case 'SUBSCRIPT': chain.toggleSubscript().run(); break;
            default: break;
        }
        persist();
    }, [editor, persist]);

    const toggleBlockType = useCallback((blockType) => {
        if (!editor) return;

        const chain = editor.chain().focus();
        switch (blockType) {
            case 'ordered-list-item': chain.toggleOrderedList().run(); break;
            case 'unordered-list-item': chain.toggleBulletList().run(); break;
            default: break;
        }
    }, [editor]);

    // ================================ GET/RESET CONTENT ================================
    const getContent = useCallback(() => {
        deletedImageIdsWhileEditing.forEach(imageId => imageApi.deleteById(imageId));
        setAddedImageIdsWhileEditing([]);
        setDeletedImageIdsWhileEditing([]);

        deletedAudioIdsWhileEditing.forEach(audioId => audioApi.deleteById(audioId));
        setAddedAudioIdsWhileEditing([]);
        setDeletedAudioIdsWhileEditing([]);

        deletedVideoIdsWhileEditing.forEach(videoId => videoApi.deleteById(videoId));
        setAddedVideoIdsWhileEditing([]);
        setDeletedVideoIdsWhileEditing([]);

        return { html: editor.getHTML(), json: null, tiptapJson: editor.getJSON() };
    }, [editor, deletedImageIdsWhileEditing, deletedAudioIdsWhileEditing, deletedVideoIdsWhileEditing]);

    const resetContent = useCallback(() => {
        addedImageIdsWhileEditing.forEach(imageId => imageApi.deleteById(imageId));
        setAddedImageIdsWhileEditing([]);
        setDeletedImageIdsWhileEditing([]);

        addedAudioIdsWhileEditing.forEach(audioId => audioApi.deleteById(audioId));
        setAddedAudioIdsWhileEditing([]);
        setDeletedAudioIdsWhileEditing([]);

        addedVideoIdsWhileEditing.forEach(videoId => videoApi.deleteById(videoId));
        setAddedVideoIdsWhileEditing([]);
        setDeletedVideoIdsWhileEditing([]);

        if (editor) {
            editor.commands.setContent(originalContentRef.current);
        }
    }, [editor, addedImageIdsWhileEditing, addedAudioIdsWhileEditing, addedVideoIdsWhileEditing]);

    // ================================ IMPERATIVE HANDLE ================================
    React.useImperativeHandle(ref, () => ({
        addLink,
        addQuote,
        addImage,
        addAudio,
        addVideo,
        getContent,
        resetContent,
        toggleInlineStyle,
        toggleBlockType,
        hasError: () => initErrorRef.current != null,
    }));

    // ================================ MOUSE SELECTION TOOLBAR ================================
    const handleMouseUp = (e) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        if (from !== to) {
            let left = e.clientX;
            let top = e.clientY;
            const estimatedToolbarWidth = 280;
            const estimatedToolbarHeight = 60;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (left + estimatedToolbarWidth > viewportWidth) {
                left = viewportWidth - estimatedToolbarWidth - 10;
            }
            left = Math.max(10, left);
            if (top + estimatedToolbarHeight > viewportHeight) {
                top = viewportHeight - estimatedToolbarHeight - 10;
            }
            top = Math.max(10, top);

            setContextMenuPosition({ top, left });
            setContextMenuIsOpen(true);
        } else {
            setContextMenuIsOpen(false);
        }
    };

    if (initErrorRef.current) {
        return null;
    }

    return (
        <div
            className='relative flex justify-center cursor-text'
            onMouseUp={handleMouseUp}
            style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-editor)',
            }}
        >
            <div
                className={(editable ? 'border-2' : 'caret-transparent') + ' overflow-y-auto max-w-6xl w-full'}
                style={{
                    borderColor: editable ? 'var(--border-secondary)' : 'transparent',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-editor)',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                }}
            >
                <EditorContent editor={editor} />
            </div>
            {/* Link hover preview */}
            <ContextMenu
                isOpen={!!linkHover}
                onClose={() => setLinkHover(null)}
                position={linkHover?.position || { top: 0, left: 0 }}
            >
                {linkHover?.article && (
                    <div className='flex flex-col'>
                        <p>{linkHover.article.title}</p>
                        <ArticleInfo article={linkHover.article} isEditable={false} showReadTime={true} />
                    </div>
                )}
            </ContextMenu>
            {/* Link right-click context menu */}
            <ContextMenu
                isOpen={!!linkContextMenu}
                onClose={() => setLinkContextMenu(null)}
                position={linkContextMenu?.position || { top: 0, left: 0 }}
            >
                <div className='flex flex-col'>
                    <ActionButton color='red' onClick={handleRemoveLink}>
                        {t('remove link')}
                    </ActionButton>
                </div>
            </ContextMenu>
            {/* Quote right-click context menu */}
            <ContextMenu
                isOpen={!!quoteContextMenu}
                onClose={() => setQuoteContextMenu(null)}
                position={quoteContextMenu?.position || { top: 0, left: 0 }}
            >
                <div className='flex flex-col'>
                    <ActionButton color='red' onClick={handleRemoveQuote}>
                        {t('remove quote')}
                    </ActionButton>
                </div>
            </ContextMenu>
        </div>
    );
});

export default TiptapEditor;
