module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('category', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            validate: {
                is: /^\w{2,}$/
            }
        },
        color: { type: DataTypes.STRING }
    });

    return Category;
}