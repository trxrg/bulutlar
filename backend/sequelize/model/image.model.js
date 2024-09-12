module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('image', {
        path: { allowNull: false, type: DataTypes.STRING },
        description: { type: DataTypes.STRING }
    });

    return Image;
};
