const express=require('express');
const bodyParser=require('body-parser');
const sqlite3=require('sqlite3').verbose();
const cors=require('cors');
const path = require('path');

const app=express();
const port=3000;

app.use(cors());
app.use(bodyParser.json());

//Connect to SQLite database file books.sqlite
const db=new sqlite3.Database('./books.sqlite');

db.serialize(() => {
    //Create books table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);

    //Insert dummy entries into books table
    const dummyBooks=[ 
        {author:"J. R. R. Tolkien", title:"Lord of the Rings", genre:"Fantasy", price:20.5},
        {author:"W. G. Sebald", title:"The Rings of Saturn", genre:"Fiction", price:13.7},
        {author:"George Orwell", title:"1984", genre:"Mystery", price:15.0},
        {author:"Mary Shelley", title:"Frankenstein", genre:"Horror", price:10.5}
    ];

    dummyBooks.forEach(book => {
        db.run(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`, [book.author, book.title, book.genre, book.price]);
    });
});

//Endpoint for registering a new book
app.post('/books', function (req, res) {
    const { author, title, genre, price } = req.body;
    db.run(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`, [author, title, genre, price], function(err) { //Book registering
        if (err) { //If there was an error in the registering process, status 500 is returned with a message
            res.status(500).json({message: "Error registering the book."});
        } else { //If there was not an error in the registering process message "Book registered successfully." is returned
            res.json({message: "Book registered successfully."});
        }
    });
});

//Endpoint for searching books by keyword
app.get('/books/:keyword', function (req, res) {
    const keyword=`%${req.params.keyword}%`;
    db.all(`SELECT * FROM books WHERE title LIKE ?`, [keyword], (err, rows) => {
        if (err) { //If there was an error in the searching process, status 500 is returned with a message
            res.status(500).json({message: "Error searching for books."});
        } else { //If there was not an error in the searching process the books that have been found return as a response
            res.json(rows);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});


//Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});