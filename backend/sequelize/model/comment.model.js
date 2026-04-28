export default (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {        
        // author: { type: DataTypes.STRING }, TODO
        date: { type: DataTypes.DATE },
        text: { type: DataTypes.STRING },
        textJson: { type: DataTypes.JSON },
        tiptapTextJson: { type: DataTypes.JSON },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING },
        uuid: { type: DataTypes.STRING, allowNull: true, unique: true },
        revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
    });

    return Comment;
}