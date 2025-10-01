const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require('cors');

const app = express();

app.use(cors({ // Ignore this, it's to allow requests form a vite react dev server
    origin: 'http://localhost:5173'
  }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add a new book to the database
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;
    const check_query = `SELECT * FROM books WHERE title = ? AND author = ?`;

    // Check if the book already exists in the database before adding it
    db.get(check_query, [title, author], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to add book.' });
        }
        if (row) {
            return res.status(409).json({ success: false, message: 'This book already exists.' });
        }

        // Only proceed to insert the new book if it does not already exist (based on title and author only)
        const query = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;
        db.run(query, [author, title, genre, price], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to add book.' });
            }
            res.status(201).json({ success: true, message: 'Book added successfully!', bookId: this.lastID });
        });
    });
});


app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    let query;
    let queryParams;

    // If the keyword is *, return all books
    if (keyword === '*') {
        query = `SELECT * FROM books`;
        queryParams = [];
    } else {
        // Else just search by the title keyword
        query = `SELECT * FROM books WHERE title LIKE ?`;
        queryParams = [`%${keyword}%`];
    }

    db.all(query, queryParams, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to search books.' });
        }
        res.status(200).json({ success: true, books: rows });
    });
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});