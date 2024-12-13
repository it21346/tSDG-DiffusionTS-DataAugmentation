const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.sqlite');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);

    const stmt = db.prepare('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)');
    stmt.run("J. R. R. Tolkien", "Lord of the Rings", "Fantasy", 20.5);
    stmt.run("W. G. Sebald", "The Rings of Saturn", "Fiction", 13.7);
    stmt.finalize();
});

db.close();
