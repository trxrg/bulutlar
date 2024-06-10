module.exports = (sequelize, DataTypes) => {
    sequelize.define('tag', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            // validate: {
            //     is: /^\w{1,}$/
            // }
        }
    })
}