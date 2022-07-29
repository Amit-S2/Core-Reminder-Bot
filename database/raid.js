const Sequelize = require('sequelize');
const db = require('./connection');

const Raid = db.define('Raid', {
    faction: {
        type: Sequelize.STRING,
        allowNull: false
    },
    raidTime: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lastAlert: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});


module.exports = Raid;
