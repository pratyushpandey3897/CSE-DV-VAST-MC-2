import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('db/vast.2022.mc2');
Object.freeze(db);

export default function query(command, method = 'all') {
    return new Promise((resolve, reject) => {
        db[method](command, (error, result) => (error) 
            ? reject(error) 
            : resolve(result)
        );
    });
};