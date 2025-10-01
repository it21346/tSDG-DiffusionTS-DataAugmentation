const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('books.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to the database:', err);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);
});

module.exports = db;