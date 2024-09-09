module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('article', {
        title: { allowNull: false, type: DataTypes.STRING },
        date: { allowNull: false, type: DataTypes.DATE },
        number: { allowNull: false, type: DataTypes.INTEGER },
        explanation: { allowNull: false, type: DataTypes.TEXT },
        explanationJson: { allowNull: false, type: DataTypes.JSON },
        text: { allowNull: false, type: DataTypes.TEXT },
        textJson: { allowNull: true, type: DataTypes.JSON },
        code: {allowNull: false, type: DataTypes.STRING }
    });

    return Article;
};