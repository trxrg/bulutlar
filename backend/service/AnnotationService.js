const { ipcMain } = require('electron');
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('annotation/getAll', getAllAnnotations);
    ipcMain.handle('annotation/getById', (event, annotationId) => getAnnotationById(annotationId));
    ipcMain.handle('annotation/deleteById', (event, annotationId) => deleteAnnotationById(annotationId));
    ipcMain.handle('annotation/updateNote', (event, annotationId, newNote) => updateNote(annotationId, newNote));
}

async function getAllAnnotations() {
    let entities = await sequelize.models.annotation.findAll();
    return entities.map(entity => entity.dataValues);
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

async function getAnnotationById(annotationId) {
    try {
        const annotation = await sequelize.models.annotation.findByPk(annotationId);

        if (!annotation)
            throw ('no annotation found with id: ' + annotationId);

        return annotation.dataValues;

    } catch (err) {
        console.error('Error in getAnnotationById', err);
    }
}

async function deleteAnnotationById(annotationId) {

    try {
        const annotation = await sequelize.models.annotation.findByPk(annotationId);

        if (!annotation)
            throw ('no annotation found with id: ' + annotationId);

        await annotation.destroy();

    } catch (err) {
        console.error('Error in deleteAnnotation', err);
    }
}

async function deleteAnnotationsByArticleId(articleId) {
    try {
        await sequelize.models.annotation.destroy({
            where: { articleId: articleId }
        });
    } catch (err) {
        console.error('Error in deleteAnnotationsByArticleId', err);
    }
}

module.exports = {
    initService,
    createAnnotation,
    deleteAnnotationsByArticleId,
};
