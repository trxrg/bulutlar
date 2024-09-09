module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('article', {
        title: { allowNull: false, type: DataTypes.STRING },
        date: { allowNull: false, type: DataTypes.DATE },
        number: { allowNull: false, type: DataTypes.INTEGER },
        order: { type: DataTypes.INTEGER },
        explanation: { allowNull: false, type: DataTypes.TEXT },
        explanationJson: { type: DataTypes.JSON },
        text: { allowNull: false, type: DataTypes.TEXT },
        textJson: { type: DataTypes.JSON },
        code: { allowNull: false, type: DataTypes.STRING }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['order'],
            },
        ],
    });

    return Article;
};