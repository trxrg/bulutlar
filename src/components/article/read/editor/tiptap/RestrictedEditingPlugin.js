import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

const RestrictedEditing = Extension.create({
    name: 'restrictedEditing',

    addOptions() {
        return {
            restricted: false,
        };
    },

    addStorage() {
        return {
            restricted: this.options.restricted,
        };
    },

    addProseMirrorPlugins() {
        const storage = this.storage;

        return [
            new Plugin({
                filterTransaction(transaction) {
                    if (!storage.restricted) return true;
                    if (!transaction.docChanged) return true;

                    const isMarkOnly = transaction.steps.every(step => {
                        const stepJson = step.toJSON();
                        return stepJson.stepType === 'addMark' || stepJson.stepType === 'removeMark';
                    });
                    return isMarkOnly;
                },
            }),
        ];
    },
});

export default RestrictedEditing;
