export default (sequelize, DataTypes) => {
    const Tag = sequelize.define('tag', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
            // validate: {
            //     is: /^\w{1,}$/
            // }
        },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING }
    });

    return Tag;
}