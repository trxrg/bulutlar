module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {
        date: { type: DataTypes.DATE },
        text: { type: DataTypes.STRING },
        textJson: { type: DataTypes.JSON }
    });

    return Comment;
}