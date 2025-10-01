const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const host = 'localhost';
const PORT = 3000;
app.use(express.json());
app.use(express.static('client'));

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'books.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

app.use(bodyParser.json());

// Create table if it doesn't exist
const createTableSQL = `
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )
`;

db.run(createTableSQL, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Books table is ready.');
    }
});




// Add a new book
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;

    if (!author || !title || !genre || isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Invalid data provided.' });
    }

    const query = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;
    db.run(query, [author, title, genre, price], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Failed to add book.' });
        }
        res.status(201).json({ message: 'Book added successfully.', id: this.lastID });
    });
});

// Search for books by keyword
app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    const query = `SELECT * FROM books WHERE title LIKE ?`;

    db.all(query, [`%${keyword}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to search books.' });
        }
        res.status(200).json(rows);
    });
});

// Start server
app.listen(PORT,host, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

