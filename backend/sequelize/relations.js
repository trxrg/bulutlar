function setRelations(sequelize) {
	console.info('setting model relations');

	const { owner, article, comment, image, annotation, tag, category, group } = sequelize.models;

	owner.hasMany(article);
	article.belongsTo(owner);

	article.hasMany(comment);
	comment.belongsTo(article);

	article.hasMany(image);
	image.belongsTo(article);

	category.hasOne(image);
	group.hasOne(image);

	article.hasMany(annotation);
	annotation.belongsTo(article);

	category.hasMany(article);
	article.belongsTo(category);

	tag.belongsToMany(article, { through: 'article_tag_rel' });
	article.belongsToMany(tag, { through: 'article_tag_rel' });

	group.belongsToMany(article, { through: 'article_group_rel' });
	article.belongsToMany(group, { through: 'article_group_rel' });

	article.belongsToMany(article, { through: 'article_article_rel', as: 'relatedArticles', foreignKey: 'articleId', otherKey: 'relatedArticleId' });

	console.info('model relations set');
}

export { setRelations };
