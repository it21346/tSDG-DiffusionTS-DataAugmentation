const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

var app = express();

app.use(bodyParser.json());
app.use(express.static('Frontend'));

let db = new sqlite3.Database('./books.sqlite', (err) => { // Create db
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});


db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='books'", (err, row) => { //Create table
    if (err) {
        return console.error(err.message);
    }
    if (!row) {
        db.run('CREATE TABLE books (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, title TEXT NOT NULL, genre TEXT NOT NULL, price REAL NOT NULL)', (err) => {
            if (err) {
                return console.error(err.message);
            }
        });
    }
});

app.get('/books/:keyword', (req, res) => { // Books search
    db.all(`SELECT * FROM books WHERE title LIKE ?`, [`%${req.params.keyword}%`], (err, rows) => {
        if (err) {
            res.status(500).send({ message: 'Failed to retrieve books. Please try again later.' });
            return console.error(err.message);
        }
        res.send(rows);
    });
});


app.post('/books', (req, res) => { // Add book, only if another book with the same title and author doesn't exist
    const { author, title, genre, price } = req.body;
    db.get(`SELECT * FROM books WHERE title = ? AND author = ?`, [title, author], (err, row) => {
        if (err) {
            res.status(500).send({ message: 'Failed to add book. Please try again later.' });
            return console.error(err.message);
        }
        if (row) {
            res.status(400).send({ message: 'Book with the same title and author already exists.' });
        } else {
            db.run(`INSERT INTO books(author, title, genre, price) VALUES(?, ?, ?, ?)`, [author, title, genre, price], function(err) {
                if (err) {
                    res.status(500).send({ message: 'Failed to add book. Please try again later.' });
                    return console.error(err.message);
                }
                res.send({ message: 'Book successfully added', id: this.lastID });
            });
        }
    });
});

app.listen(3000, (localhost) => {
    console.log('Server is running on port 3000');
});