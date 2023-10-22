const sqlite3 = require('sqlite3').verbose();

class Database {
    
    constructor(database = 'db/vast.2022.mc2') {
        this.sqlite3 = new sqlite3.Database(database);
    }

    each(sql, callback) {
        this.sqlite3.each(sql, callback);
    }

}

module.exports = {
    Database
}