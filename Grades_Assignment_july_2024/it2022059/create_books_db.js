const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.sqlite');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author VARCHAR(25) NOT NULL,
            title VARCHAR(40) NOT NULL,
            genre VARCHAR(20) NOT NULL,
            price REAL NOT NULL
        )
    `);

    //Add dummy entries
    const stmt = db.prepare('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)');
    stmt.run("J.K. Rowling", "Harry Potter and the Philosopher's Stone", "Fantasy", 19.99);
    stmt.run("George Orwell", "1984", "Dystopian", 15.99);
    stmt.run("J.R.R. Tolkien", "The Lord of the Rings", "Fantasy", 25.99);
    stmt.run("Harper Lee", "To Kill a Mockingbird", "Classic", 18.99);
    stmt.run("F. Scott Fitzgerald", "The Great Gatsby", "Classic", 14.99);
    stmt.finalize();

    console.log("Database created and dummy entries added successfully.");
});

db.close();