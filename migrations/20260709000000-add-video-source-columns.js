'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('videos', 'sourceType', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'local',
        });
        await queryInterface.addColumn('videos', 'sourceUrl', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.changeColumn('videos', 'path', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('videos', 'path', {
            type: Sequelize.STRING,
            allowNull: false,
        });
        await queryInterface.removeColumn('videos', 'sourceUrl');
        await queryInterface.removeColumn('videos', 'sourceType');
    },
};
