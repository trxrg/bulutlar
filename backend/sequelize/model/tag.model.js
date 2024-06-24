module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define('tag', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            // validate: {
            //     is: /^\w{1,}$/
            // }
        }
    });

    return Tag;
}