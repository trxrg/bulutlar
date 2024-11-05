'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Re-establish the foreign key relationship between owner and article
    await queryInterface.addColumn('articles', 'ownerId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'owners', // Name of the related table
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Re-establish the foreign key relationship between category and article
    await queryInterface.addColumn('articles', 'categoryId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'categories', // Name of the related table
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Re-establish other relationships if needed
    // For example, if you have other foreign keys or many-to-many relationships
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the foreign key relationship between owner and article
    await queryInterface.removeColumn('articles', 'ownerId');

    // Remove the foreign key relationship between category and article
    await queryInterface.removeColumn('articles', 'categoryId');

    // Remove other relationships if needed
  }
};