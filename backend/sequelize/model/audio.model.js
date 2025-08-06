export default (sequelize, DataTypes) => {
    const Audio = sequelize.define('audio', {
        name: { allowNull: false, type: DataTypes.STRING },
        type: { allowNull: false, type: DataTypes.STRING },
        path: { allowNull: false, type: DataTypes.STRING },
        size: { type: DataTypes.INTEGER },
        description: { type: DataTypes.STRING },
        duration: { type: DataTypes.INTEGER }, // in seconds
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING }
    });

    return Audio;
};
