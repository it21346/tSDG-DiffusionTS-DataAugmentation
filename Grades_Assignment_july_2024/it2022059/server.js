const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

//Serve static files from the current directory
app.use(express.static(__dirname));

//Parse JSON data from requests
app.use(bodyParser.json());



//Create or open an in-memory SQLite database
const db = new sqlite3.Database('books.sqlite');

//Create a 'books' table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author VARCHAR(25) NOT NULL,
            title VARCHAR(40) NOT NULL,
            genre VARCHAR(20) NOT NULL,
            price REAL NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Error creating table:", err.message);
        } else {
            console.log("Table 'books' created successfully");
        }
    });
});

//Endpoint for adding a book
app.post('/books/', (req, res) => {
    const { author, title, genre, price } = req.body;

    console.log('Received POST request with data:', { author, title, genre, price });

    if (!author || !title || !genre || !price) {
        console.error('Missing fields:', { author, title, genre, price });
        return res.status(400).json({ message: 'All fields are required' });
    }

    //Check if the book already exists
    db.get('SELECT * FROM books WHERE author = ? AND title = ?', [author, title], (err, row) => {
        if (err) {
            console.error("Error checking existing book:", err.message);
            return res.status(500).json({ message: 'Error checking existing book' });
        }

        if (row) {
            console.log('Book already exists:', row);
            return res.status(409).json({ message: 'Book already exists' });
        }

        //Insert the book into the database
        const stmt = db.prepare('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)');
        stmt.run(author, title, genre, price, function (err) {
            if (err) {
                console.error("Error adding book:", err.message);
                return res.status(500).json({ message: 'Error adding book' });
            }
            console.log('Book added successfully with ID:', this.lastID);
            res.status(201).json({ message: 'Book added successfully!' });
        });
        stmt.finalize();
    });
});

//Endpoint for searching books by keyword
app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;

    console.log('Received GET request with keyword:', keyword);

    //Search for books with titles containing the specified keyword
    db.all('SELECT * FROM books WHERE title LIKE ?', [`%${keyword}%`], (err, rows) => {
        if (err) {
            console.error("Error retrieving books:", err.message);
            return res.status(500).json({ message: 'Error retrieving books' });
        }
        console.log('Books retrieved:', rows);
        res.json(rows);
    });
});

//Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});