module.exports = (sequelize, DataTypes) => {
    const Group = sequelize.define('group', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            // validate: {
            //     is: /^\w{1,}$/
            // }
        }
    });

    return Group;
}