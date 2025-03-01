export default (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {        
        // author: { type: DataTypes.STRING }, TODO
        date: { type: DataTypes.DATE },
        text: { type: DataTypes.STRING },
        textJson: { type: DataTypes.JSON },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING }
    });

    return Comment;
}