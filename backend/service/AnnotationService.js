const { ipcMain } = require('electron');
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('annotation/deleteAnnotation', (event, annotationId) => deleteAnnotation(annotationId));
    ipcMain.handle('annotation/updateNote', (event, annotationId, newNote) => updateNote(annotationId, newNote));
}

async function createAnnotation(annotation) {
    try {
        const result = await sequelize.models.annotation.create({
            quote: annotation.quote,
            note: annotation.note
        });

        return result;

    } catch (err) {
        console.error('Error in createAnnotation ', err);
    }
}

async function updateNote(annotationId, newNote) {
    try {
        await sequelize.models.annotation.update(
            {
                note: newNote
            },
            { where: { id: annotationId } }
        );

    } catch (error) {
        console.error('Error in annotationService updateNote()', error);
    }
}

async function deleteAnnotation(annotationId) {

    try {
        const annotation = await sequelize.models.annotation.findByPk(annotationId);

        if (!annotation)
            throw ('no annotation found with id: ' + annotationId);

        await annotation.destroy();

    } catch (err) {
        console.error('Error in deleteAnnotation', err);
    }
}

module.exports = {
    initService,
    createAnnotation,
};
