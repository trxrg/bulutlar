module.exports = (sequelize, DataTypes) => {
    sequelize.define('category', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            validate: {
                is: /^\w{3,}$/
            }
        }
    })
}