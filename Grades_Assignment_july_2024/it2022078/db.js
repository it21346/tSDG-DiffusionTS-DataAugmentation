const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./books.sqlite');
require('path');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);

    db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
        if (err) {
            console.error("Error checking table:", err);
            return;
        }

        if (row.count === 0) {
            const statement = db.prepare(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`);
            const books = [
                ["J. R. R. Tolkien", "Lord of the Rings", "fantasy", 20.5],
                ["W. G. Sebald", "The Rings of Saturn", "fiction", 13.7],
                ["Frank Herbert", "Dune", "Science fiction", 18.99],
                ["Joseph Heller", "Catch-22", "Satire", 12.99],
                ["F. Scott Fitzgerald", "The Great Gatsby", "Drama", 10.99],
                ["Clive Cussler", "Sahara", "Action and Adventure", 13.99],
                ["Diana Gabaldon", "Outlander", "Romance", 16.99],
                ["Raymond Chandler", "The Big Sleep", "Mystery", 11.99],
                ["H. P. Lovecraft", "The Call of Cthulhu", "Horror", 14.99],
            ];
            books.forEach(book => statement.run(book));
            statement.finalize();
        }
    });
});

module.exports = db;