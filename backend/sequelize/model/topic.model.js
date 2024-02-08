module.exports = (sequelize, DataTypes) => {
    sequelize.define('topic', {
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