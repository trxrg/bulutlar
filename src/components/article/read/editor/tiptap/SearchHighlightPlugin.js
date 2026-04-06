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
        };
    },

    addCommands() {
        return {
            setSearchTerm: (term) => ({ editor }) => {
                editor.storage.searchHighlight.searchTerm = term;
                // Force a state update to re-run decorations
                const { tr } = editor.state;
                tr.setMeta(searchHighlightKey, { searchTerm: term });
                editor.view.dispatch(tr);
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        const extensionThis = this;

        return [
            new Plugin({
                key: searchHighlightKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, oldDecorationSet, oldState, newState) {
                        const meta = tr.getMeta(searchHighlightKey);
                        const searchTerm = meta?.searchTerm ?? extensionThis.storage.searchTerm;

                        if (!searchTerm) return DecorationSet.empty;

                        const normalizedSearchTerm = normalizeText(searchTerm);
                        if (!normalizedSearchTerm) return DecorationSet.empty;

                        const decorations = [];
                        const regex = new RegExp(escapeRegExp(normalizedSearchTerm), 'gi');

                        newState.doc.descendants((node, pos) => {
                            if (!node.isText) return;

                            const text = node.text;
                            const { normalized, normalizedToOriginalStart } = normalizeTextWithMapping(text);

                            let match;
                            while ((match = regex.exec(normalized)) !== null) {
                                const [originalStart, originalEnd] = normalizedRangeToOriginal(
                                    normalizedToOriginalStart, match.index, regex.lastIndex, text.length
                                );
                                decorations.push(
                                    Decoration.inline(pos + originalStart, pos + originalEnd, {
                                        class: 'search-highlight',
                                    })
                                );
                            }
                        });

                        return DecorationSet.create(newState.doc, decorations);
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
