module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('article', {
        order: { type: DataTypes.INTEGER },
        title: { allowNull: false, type: DataTypes.STRING, validate: { is: /^(?=(?:\s*\w+\s*){3})[\w\s]+$/ } },
        date: { allowNull: false, type: DataTypes.DATE },
        number: { allowNull: false, type: DataTypes.INTEGER },
        explanation: { allowNull: false, type: DataTypes.TEXT },
        text: { allowNull: false, type: DataTypes.TEXT },
        comment: { allowNull: false, type: DataTypes.TEXT }
    });

    return Article;
};