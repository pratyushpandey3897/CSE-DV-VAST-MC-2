const sqlite3 = require('sqlite3').verbose();
const { Database } = require('./db.js');

new Database().each("SELECT * from Restaurants", (_, row) => {
    console.log(row.restaurantId);
});

