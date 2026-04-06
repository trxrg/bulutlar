'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('articles', 'explanationTiptapJson', {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn('articles', 'textTiptapJson', {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn('comments', 'tiptapTextJson', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('articles', 'explanationTiptapJson');
        await queryInterface.removeColumn('articles', 'textTiptapJson');
        await queryInterface.removeColumn('comments', 'tiptapTextJson');
    }
};
