module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {        
        // author: { type: DataTypes.STRING }, TODO
        date: { type: DataTypes.DATE },
        text: { type: DataTypes.STRING },
        textJson: { type: DataTypes.JSON }
    });

    return Comment;
}