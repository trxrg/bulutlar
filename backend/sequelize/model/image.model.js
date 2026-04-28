export default (sequelize, DataTypes) => {
    const Image = sequelize.define('image', {
        name: { allowNull: false, type: DataTypes.STRING },
        type: { allowNull: false, type: DataTypes.STRING },
        path: { allowNull: false, type: DataTypes.STRING },
        size: { type: DataTypes.INTEGER },
        description: { type: DataTypes.STRING },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING },
        uuid: { type: DataTypes.STRING, allowNull: true, unique: true },
        revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
    });

    return Image;
};
