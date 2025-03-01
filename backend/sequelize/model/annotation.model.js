import { DataTypes } from 'sequelize';

const Annotation = (sequelize) => {
    return sequelize.define('annotation', {
        quote: { type: DataTypes.TEXT },
        note: { type: DataTypes.TEXT },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING }
    });
};

export default Annotation;