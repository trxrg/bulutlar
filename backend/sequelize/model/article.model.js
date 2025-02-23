import { DataTypes } from 'sequelize';

export default (sequelize) => {
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
        date: { type: DataTypes.DATE },
        number: { type: DataTypes.INTEGER },
        date2: { type: DataTypes.DATE },
        number2: { type: DataTypes.INTEGER },
        order: { type: DataTypes.INTEGER },
        ordering: { type: DataTypes.INTEGER },
        explanation: { type: DataTypes.TEXT },
        explanationJson: { type: DataTypes.JSON },
        text: { type: DataTypes.TEXT },
        textJson: { type: DataTypes.JSON },
        code: { allowNull: false, type: DataTypes.STRING },
        isEditable: { type: DataTypes.BOOLEAN, defaultValue: true },
        isDateUncertain: { type: DataTypes.BOOLEAN, defaultValue: false },
        isStarred: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['ordering'],
            },
        ],
    });

    return Article;
};