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
        field2: { type: DataTypes.STRING }
    });

    return Group;
};
