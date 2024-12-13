const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sqlite = require('sqlite3').verbose();
const path = require('path');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000);

//handles the connection to the database, if it exists it opens, if it does not exist it is created and then opens
const db = new sqlite.Database('./book.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the books database.');
});

//creates the books table
const createTable = `
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author VARCHAR(25) NOT NULL,
    title VARCHAR(40) NOT NULL,
    genre VARCHAR(20) NOT NULL,
    price REAL NOT NULL
);
`;

//handles the post process and the insertion of the book in the database
db.run(createTable);
app.post('/books', (req, res) => {
    try {
        const { author, title, genre, price } = req.body;
        const insert = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;

        db.run(insert, [author, title, genre, price], function(err) {
            if (err) {
                res.status(500).json({ message: 'Failed to add book', error: err.message });
                return console.error(err.message);
            }
            res.status(201).json({ message: 'Book added successfully', bookId: this.lastID });
        });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//handles the get process and the search using keyword
app.get('/books/:keyword', (req, res) => {
    try {
        const keyword = req.params.keyword;
        const search = `SELECT * FROM books WHERE title LIKE ?`;
        db.all(search, [`%${keyword}%`], (err, rows) => {
            if (err) {
                res.status(500).json({ message: 'Failed to retrieve books', error: err.message });
                return console.error(err.message);
            }
            res.status(200).json(rows);
        });
    } catch (error) {
        console.error('Error retrieving books:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




