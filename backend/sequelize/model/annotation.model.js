import { DataTypes } from 'sequelize';

const Annotation = (sequelize) => {
    return sequelize.define('annotation', {
        quote: {
            type: DataTypes.TEXT
        },
        note: {
            type: DataTypes.TEXT
        }
    });
};

export default Annotation;