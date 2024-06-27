module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('article', {
        title: { allowNull: false, type: DataTypes.STRING, validate: { is: /^(?=(?:\s*\w+\s*){3})[\w\s]+$/ } },
        date: { allowNull: false, type: DataTypes.DATE },
        number: { allowNull: false, type: DataTypes.INTEGER },
        explanation: { allowNull: false, type: DataTypes.TEXT },
        text: { allowNull: false, type: DataTypes.TEXT },
        code: {allowNull: false, type: DataTypes.STRING }
    });

    return Article;
};