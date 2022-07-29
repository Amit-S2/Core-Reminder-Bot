const Sequelize = require("sequelize");
const con = new Sequelize('sqlite:./database.db', {
    logging: true
})

module.exports = con;