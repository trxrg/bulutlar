module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('article', {
        title: {
            allowNull: false,
            type: DataTypes.STRING,
            validate: {
                len: {
                    args: [1, 255],
                    msg: "Title must be at least 1 character long.",
                },
                notEmpty: {
                    msg: "Title cannot be empty."
                },
                is: {
                    args: [/^(?=.*[a-zA-Z0-9]).+$/], // Requires at least one alphanumeric character
                    msg: "Title must contain at least one alphanumeric character."
                },
            }
        },
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