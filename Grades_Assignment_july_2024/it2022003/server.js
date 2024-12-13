const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
// Create and open the SQLite database
const db = new sqlite3.Database('./books.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        db.run(`CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author VARCHAR(25) NOT NULL,
            title VARCHAR(40) NOT NULL,
            genre VARCHAR(20) NOT NULL,
            price REAL NOT NULL
        )`);
    }
});

// POST /books - Add a new book
app.post('/books', (req, res) => {
    const { id, author, title, genre, price } = req.body;

    if (!id || !author || !title || !genre || !price || isNaN(price)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    db.run('INSERT INTO books (id, author, title, genre, price) VALUES (?, ?, ?, ?, ?)',
        [id, author, title, genre, parseFloat(price)], function(err) {
            if (err) {
                console.error('Error inserting book:', err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.status(201).json({ message: 'Book added successfully', id: this.lastID });
            }
        });
});

// GET /books/:keyword - Search for books by keyword in title
app.get('/books/:keyword', (req, res) => {
    const { keyword } = req.params;
    db.all('SELECT * FROM books WHERE title LIKE ?', [`%${keyword}%`], (err, rows) => {
        if (err) {
            console.error('Error fetching books:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else if (rows.length === 0) {
            res.status(404).json({ message: 'No books found' });
        } else {
            res.status(200).json(rows);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
