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
        ordering: { type: DataTypes.INTEGER },
        explanation: { type: DataTypes.TEXT },
        explanationJson: { type: DataTypes.JSON },
        text: { type: DataTypes.TEXT },
        textJson: { type: DataTypes.JSON },
        code: { type: DataTypes.STRING },
        isEditable: { type: DataTypes.BOOLEAN, defaultValue: true },
        isDateUncertain: { type: DataTypes.BOOLEAN, defaultValue: false },
        isStarred: { type: DataTypes.BOOLEAN, defaultValue: false },
        isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
        isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
        isDraft: { type: DataTypes.BOOLEAN, defaultValue: false },
        isHidden: { type: DataTypes.BOOLEAN, defaultValue: false },
        isProtected: { type: DataTypes.BOOLEAN, defaultValue: false },
        isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
        isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
        isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
        isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING },
        field3: { type: DataTypes.STRING }
    }, {
        indexes: [
            {
                unique: false,
                fields: ['ordering'],
            },
        ],
    });

    return Article;
};