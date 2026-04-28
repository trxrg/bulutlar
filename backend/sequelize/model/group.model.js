import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Group = sequelize.define('group', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
        },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING },
        uuid: { type: DataTypes.STRING, allowNull: true, unique: true },
        revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
    });

    return Group;
};
