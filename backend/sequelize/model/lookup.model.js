module.exports = (sequelize, DataTypes) => {
    const Lookup = sequelize.define('lookup', {
        label: { allowNull: false, unique: true, type: DataTypes.STRING },
        value: { type: DataTypes.JSON },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['label'],
            },
        ],
    });

    return Lookup;
};