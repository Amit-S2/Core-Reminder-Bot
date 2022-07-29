// Load Dependencies
const Sequelize = require('sequelize');
const db = require('./connection');

// Load Models
const Raid = require('./raid')

db.sync().catch(error => console.log('Database error:', error));
// Export Models

module.exports = { Raid }