function setRelations(sequelize) {
	console.log('setting model relations');

	console.log(sequelize.models);

	const { owner, article, comment, image, annotation, tag, category, group } = sequelize.models;

	owner.hasMany(article);
	article.belongsTo(owner);

	article.hasMany(comment);
	comment.belongsTo(article);

	article.hasMany(image);
	image.belongsTo(article);

	article.hasMany(annotation);
	annotation.belongsTo(article);

	category.hasMany(article);
	article.belongsTo(category);

	tag.belongsToMany(article, { through: 'article_tag_rel' });
	article.belongsToMany(tag, { through: 'article_tag_rel' });

	group.belongsToMany(article, { through: 'article_group_rel' });
	article.belongsToMany(group, { through: 'article_group_rel' });
}

module.exports = { setRelations };
