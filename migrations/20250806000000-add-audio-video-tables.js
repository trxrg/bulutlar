'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create audios table
    await queryInterface.createTable('audios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      path: {
        allowNull: false,
        type: Sequelize.STRING
      },
      size: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      ordering: {
        type: Sequelize.INTEGER
      },
      field1: {
        type: Sequelize.STRING
      },
      field2: {
        type: Sequelize.STRING
      },
      articleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'articles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create videos table
    await queryInterface.createTable('videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      path: {
        allowNull: false,
        type: Sequelize.STRING
      },
      size: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      width: {
        type: Sequelize.INTEGER
      },
      height: {
        type: Sequelize.INTEGER
      },
      ordering: {
        type: Sequelize.INTEGER
      },
      field1: {
        type: Sequelize.STRING
      },
      field2: {
        type: Sequelize.STRING
      },
      articleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'articles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('videos');
    await queryInterface.dropTable('audios');
  }
};
