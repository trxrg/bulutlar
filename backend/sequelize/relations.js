function setRelations(sequelize) {
	const { owner, article, tag, topic, category } = sequelize.models;

	owner.hasMany(article);
	article.belongsTo(owner);

	tag.belongsToMany(article, { through: 'article_tag_rel' });
	article.belongsToMany(tag, { through: 'article_tag_rel' });

	topic.belongsToMany(article, { through: 'article_topic_rel' });
	article.belongsToMany(topic, { through: 'article_topic_rel' });

	category.belongsToMany(article, { through: 'article_category_rel' });
	article.belongsToMany(category, { through: 'article_category_rel' });
}

module.exports = { setRelations };