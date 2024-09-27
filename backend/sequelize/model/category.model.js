module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('category', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: {
                args: true,
                msg: "This category is already added."
            },
            validate: {
                len: {
                    args: [1, 255],
                    msg: "Category name must be at least 1 character long.",
                },
                notEmpty: {
                    msg: "Category name cannot be empty."
                },
                is: {
                    args: [/^(?=.*[a-zA-Z0-9]).+$/], // Requires at least one alphanumeric character
                    msg: "Category name must contain at least one alphanumeric character."
                },
            }
        },
        color: { type: DataTypes.STRING }
    });

    return Category;
}