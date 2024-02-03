function applyExtraSetup(sequelize) {
	console.log('applying extra setup');
	const { instrument, orchestra } = sequelize.models;

	orchestra.hasMany(instrument);
	instrument.belongsTo(orchestra);
	
	console.log('extra setup completed');
}

module.exports = { applyExtraSetup };