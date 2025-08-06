import { DataTypes } from 'sequelize';

function setRelations(sequelize) {
    console.info('setting model relations');

    const { owner, article, comment, image, audio, video, annotation, tag, category, group } = sequelize.models;

    owner.hasMany(article);
    article.belongsTo(owner);

    article.hasMany(comment);
    comment.belongsTo(article);

    owner.hasMany(comment);
    comment.belongsTo(owner);

    article.hasMany(image);
    image.belongsTo(article);

    article.hasMany(audio);
    audio.belongsTo(article);

    article.hasMany(video);
    video.belongsTo(article);

    category.hasOne(image);
    group.hasOne(image);

    article.hasMany(annotation);
    annotation.belongsTo(article);

    category.hasMany(article);
    article.belongsTo(category);

	const ArticleTagRel = sequelize.define('article_tag_rel', {
        tagOrdering: {
            type: DataTypes.INTEGER,
            allowNull: true,
			defaultValue: null,
			unique: false,			
        },
    });

    tag.belongsToMany(article, { through: ArticleTagRel });
    article.belongsToMany(tag, { through: ArticleTagRel });

    const ArticleGroupRel = sequelize.define('article_group_rel', {
        groupOrdering: {
            type: DataTypes.INTEGER,
            allowNull: true,
			defaultValue: null,
			unique: false,			
        },
    });

    group.belongsToMany(article, { through: ArticleGroupRel });
    article.belongsToMany(group, { through: ArticleGroupRel });

	const ArticleArticleRel = sequelize.define('article_article_rel', {
        relatedArticleOrdering: {
            type: DataTypes.INTEGER,
            allowNull: true,
			defaultValue: null,
			unique: false,			
        },
    });

    article.belongsToMany(article, { through: ArticleArticleRel, as: 'relatedArticles', foreignKey: 'articleId', otherKey: 'relatedArticleId' });

    console.info('model relations set');
}

export { setRelations };