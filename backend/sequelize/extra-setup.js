function applyExtraSetup(sequelize) {
	console.log('applying extra setup');
	const { instrument, orchestra, owner, article } = sequelize.models;

	orchestra.hasMany(instrument);
	instrument.belongsTo(orchestra);

	owner.hasMany(article);
	article.belongsTo(owner);
	
	console.log('extra setup completed');
}

module.exports = { applyExtraSetup };