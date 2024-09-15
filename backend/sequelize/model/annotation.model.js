module.exports = (sequelize, DataTypes) => {
    const Annotation = sequelize.define('annotation', {
        quote: {
            type: DataTypes.TEXT
        },
        note: {
            type: DataTypes.TEXT
        }
    });

    return Annotation;
}