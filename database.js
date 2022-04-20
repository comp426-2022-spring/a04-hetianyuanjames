// This ensures that things do not fail silently but will throw errors instead.
"use strict";

const Database = require('better-sqlite3');


const db = new Database('log.db');

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);
let row = stmt.get();
if (row === undefined) {
        console.log('Your database appears to be empty. I will initialize it now.');
    
        const sqlInit = `
            CREATE TABLE accesslog ( id INTEGER PRIMARY KEY, username TEXT, password TEXT );
        `;
    
        db.exec(sqlInit);
    } else {
        console.log('Database exists.')
    }
    
    module.exports = db