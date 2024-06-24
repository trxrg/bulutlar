module.exports = (sequelize, DataTypes) => {
    const Owner = sequelize.define('owner', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            // validate: {
            //     is: /^\w{3,}$/
            // }
        }
    });

    return Owner;
};