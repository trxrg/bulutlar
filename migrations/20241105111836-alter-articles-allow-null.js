'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a new table with the desired schema
    await queryInterface.createTable('articles_new', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
        validate: {
          len: [1, 255],
          notEmpty: true,
          is: /^(?=.*[a-zA-Z0-9]).+$/
        }
      },
      date: { type: Sequelize.DATE },
      number: { type: Sequelize.INTEGER },
      order: { type: Sequelize.INTEGER },
      explanation: { type: Sequelize.TEXT }, 
      explanationJson: { type: Sequelize.JSON },
      text: { type: Sequelize.TEXT },
      textJson: { type: Sequelize.JSON },
      code: { type: Sequelize.STRING },
      isEditable: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Copy data from the old table to the new table
    await queryInterface.sequelize.query(
      'INSERT INTO articles_new (id, title, date, number, "order", explanation, explanationJson, text, textJson, code, "isEditable", "createdAt", "updatedAt") SELECT id, title, date, number, "order", explanation, explanationJson, text, textJson, code, "isEditable", "createdAt", "updatedAt" FROM articles;'
    );

    // Drop the old table
    await queryInterface.dropTable('articles');

    // Rename the new table to the original table name
    await queryInterface.renameTable('articles_new', 'articles');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes by creating the original table schema
    await queryInterface.createTable('articles_old', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
        validate: {
          len: [1, 255],
          notEmpty: true,
          is: /^(?=.*[a-zA-Z0-9]).+$/
        }
      },
      date: { type: Sequelize.DATE },
      number: { type: Sequelize.INTEGER },
      order: { type: Sequelize.INTEGER },
      explanation: { type: Sequelize.TEXT, allowNull: false }, // Revert to NOT NULL
      explanationJson: { type: Sequelize.JSON },
      text: { type: Sequelize.TEXT },
      textJson: { type: Sequelize.JSON },
      code: { allowNull: false, type: Sequelize.STRING },
      isEditable: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Copy data from the current table to the old table schema
    await queryInterface.sequelize.query(
      'INSERT INTO articles_old (id, title, date, number, "order", explanation, explanationJson, text, textJson, code, "isEditable", "createdAt", "updatedAt") SELECT id, title, date, number, "order", explanation, explanationJson, text, textJson, code, "isEditable", "createdAt", "updatedAt" FROM articles;'
    );

    // Drop the current table
    await queryInterface.dropTable('articles');

    // Rename the old table to the original table name
    await queryInterface.renameTable('articles_old', 'articles');
  }
};