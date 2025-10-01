const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path'); // To handle file paths
const cors = require('cors'); // To handle CORS issues

const app = express();
const port = 3000;

// Middleware setup
app.use(bodyParser.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('books.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
    }
});

// Create the "books" table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author VARCHAR(25) NOT NULL,
  title VARCHAR(40) NOT NULL,
  genre VARCHAR(20) NOT NULL,
  price REAL NOT NULL
)`);

// Routes

// Route to search for books by keyword
app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    db.all(`SELECT * FROM books WHERE title LIKE ?`, [`%${keyword}%`], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Route to fetch all books
app.get('/viewBooks', (req, res) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Route to add a new book
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;

    // Check if the book already exists
    db.get('SELECT * FROM books WHERE title = ? AND author = ?', [title, author], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            // Book already exists
            res.status(400).json({ message: 'Book already exists!' });
        } else {
            // Insert the new book
            db.run(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`, [author, title, genre, price], function(err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Book added successfully!', id: this.lastID });
            });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
