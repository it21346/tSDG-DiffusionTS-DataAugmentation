const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

app.use(express.static('public'));
app.use(bodyParser.json());

const db = new sqlite3.Database('books.sqlite');

const Book = require('./book.js');
const book = new Book(db);

app.get('/books', function(req, res) { // Use it so i can see if books are added correctly
    const query = 'SELECT * FROM books';
    db.all(query, function(err, rows) {
        if(err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(rows);
        }
    });
});

app.put('/books', async (req, res) => {
    const newBook = req.body;
    try {
        await book.addBook(newBook);
        res.status(200).json({ message: 'Book added successfully' }); 
    } catch (error) {               //message is for the custom alert
        if (error.message === 'Book already exists') {
            res.status(400).json({ message: 'Book already exists' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

 app.get('/books/:keyword', async function(req, res) {
     const keyword = req.params.keyword;
    try {
         const result = await book.searchBook(keyword);
         res.status(200).json(result);
     } catch(err){
         res.status(500).json({ message: 'Internal server error' });
     }
 });

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});




