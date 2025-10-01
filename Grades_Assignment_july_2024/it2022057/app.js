const express = require('express'); // import express framework
const app = express(); // create an express application
app.use(express.static('public')); // serve static files from the 'public' directory in order to show the app if we type in the url index.html

// import body-parser for parsing json data
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const sqlite3 = require('sqlite3').verbose(); // import sqlite3 to handle databases
const db = new sqlite3.Database('./books.sqlite'); // connects to the 'books.sqlite' database

// add a new book
app.post('/books', function (req, res) {
    const newBook = req.body; // details of the new book
    // handling possible input errors
    if (!newBook.author || !newBook.title || !newBook.genre || !newBook.price || isNaN(newBook.price) || newBook.price <= 0) {
        return res.status(500).json({ message: 'Invalid input' });
    }

    // Check if the book already exists
    db.get("SELECT * FROM books WHERE title = ? AND author = ?", [newBook.title, newBook.author], function (err, row) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to add book' });
        }
        if (row) {
            // Book already exists
            return res.status(409).json({ message: 'Book already exists' });
        } else {
            // Book does not exist, proceed to insert
            const query = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?);';
            db.run(query, [newBook.author, newBook.title, newBook.genre, newBook.price], function (err) {
                if (err) {
                    console.error(err);
                    res.sendStatus(500).json({ message: 'Failed to add book' }); // send a 500 response if an error occurs
                } else {
                    res.json({ message: 'Book added successfully', id: this.lastID }); // send a 200 response and the new book's id
                    res.end();
                }
            });
        }
    });
});

// Search for books by keyword
app.get('/books/:keyword', function (req, res) {
    const keyword = req.params.keyword; // extracts the keyword provided 
    // searches the database for books with titles that contain the keyword
    db.all("SELECT * FROM books WHERE title LIKE ?;", [`%${keyword}%`], function (err, rows) {
        if (err) {
            return res.status(500).json({ message: 'Error during search!' }); // send a 500 response if an error occurs
        } else {
            if (rows.length == 0) {
                return res.status(404).json({ message: 'No match found!' }); // send a 404 response if no books match the keyword
            }
        }
        res.json(rows); // responds with the matching books in json format
        res.end();
    });
});

app.listen(3000);