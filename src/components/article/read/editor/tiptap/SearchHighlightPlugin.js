import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { normalizeText, normalizeTextWithMapping, normalizedRangeToOriginal, escapeRegExp } from '../../../../../utils/textUtils.js';

const searchHighlightKey = new PluginKey('searchHighlight');

const SearchHighlight = Extension.create({
    name: 'searchHighlight',

    addStorage() {
        return {
            searchTerm: '',
            activeIndex: -1,
        };
    },

    addCommands() {
        return {
            setSearchTerm: (term) => ({ editor }) => {
                editor.storage.searchHighlight.searchTerm = term;
                editor.storage.searchHighlight.activeIndex = -1;
                const { tr } = editor.state;
                tr.setMeta(searchHighlightKey, { searchTerm: term });
                editor.view.dispatch(tr);
                return true;
            },
            setActiveHighlightIndex: (index) => ({ editor }) => {
                editor.storage.searchHighlight.activeIndex = index;
                const { tr } = editor.state;
                tr.setMeta(searchHighlightKey, { activeIndex: index });
                editor.view.dispatch(tr);
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        const extensionThis = this;

        function buildDecorations(doc, searchTerm, activeIndex) {
            const normalizedSearchTerm = normalizeText(searchTerm);
            if (!normalizedSearchTerm) return DecorationSet.empty;

            const decorations = [];
            const regex = new RegExp(escapeRegExp(normalizedSearchTerm), 'gi');
            let decoIndex = 0;

            doc.descendants((node, pos) => {
                if (!node.isText) return;

                const text = node.text;
                const { normalized, normalizedToOriginalStart } = normalizeTextWithMapping(text);

                let match;
                while ((match = regex.exec(normalized)) !== null) {
                    const [originalStart, originalEnd] = normalizedRangeToOriginal(
                        normalizedToOriginalStart, match.index, regex.lastIndex, text.length
                    );
                    const cls = decoIndex === activeIndex
                        ? 'search-highlight search-highlight-active'
                        : 'search-highlight';
                    decorations.push(
                        Decoration.inline(pos + originalStart, pos + originalEnd, {
                            class: cls,
                        })
                    );
                    decoIndex++;
                }
            });

            return DecorationSet.create(doc, decorations);
        }

        return [
            new Plugin({
                key: searchHighlightKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, oldDecorationSet, oldState, newState) {
                        const meta = tr.getMeta(searchHighlightKey);

                        if (meta !== undefined) {
                            const searchTerm = ('searchTerm' in meta)
                                ? meta.searchTerm
                                : extensionThis.storage.searchTerm;
                            if (!searchTerm) return DecorationSet.empty;
                            const activeIndex = ('activeIndex' in meta)
                                ? meta.activeIndex
                                : extensionThis.storage.activeIndex;
                            return buildDecorations(newState.doc, searchTerm, activeIndex);
                        }

                        if (!tr.docChanged) {
                            return oldDecorationSet;
                        }

                        const searchTerm = extensionThis.storage.searchTerm;
                        if (!searchTerm) return DecorationSet.empty;
                        return buildDecorations(newState.doc, searchTerm, extensionThis.storage.activeIndex);
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});

export default SearchHighlight;
