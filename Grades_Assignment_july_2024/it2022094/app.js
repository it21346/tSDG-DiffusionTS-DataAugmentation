const express = require('express');
const app = express();
const path = require('path');


const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static(__dirname));
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.sqlite');
                                                    //εβαλα το Create εδω για να μην χριαζετε να γινει manualy
db.run(`CREATE TABLE IF NOT EXISTS books (
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    price REAL NOT NULL
)`);

app.get('/books', function(req, res) {      //Search function
    const title = req.query.title;
    let query = 'SELECT * FROM books';      //Αμα ειναι αδιο το Search τα βγαζει ολα
    const params = [];

    if (title) {
        query += ' WHERE title LIKE ?';     //Αν οχι βγαζει τα κοινα
        params.push(`%${title}%`);
    }

    db.all(query, params, function(err, rows) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(rows);
        }
    });
});

app.get('/books/:id', function(req, res) {              //Το ειχα φτιαξει οπως το ειχατε στο εργαστιριο στην αρχη για να βλεπω αμα δουλευει και το αφισα
    const id = req.params.id;
    const query = 'SELECT * FROM books WHERE rowid = ?';
    db.get(query, [id], function(err, row) {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.json(row);
        }
    });
});

app.put('/books', function(req, res) {          //add book function
    const newBook = req.body;
    const checkQuery = 'SELECT * FROM books WHERE title = ?';
    
    db.get(checkQuery, [newBook.title], function(err, row) {        //Ελενχουμε αμα υπαρχει βιβλιο με τον ιδιο τιτλο
        if (err) {
            console.error(err);
            res.sendStatus(500);        //Error code αμα δεν
        } else if (row) {
            res.status(400).json({ "message": "Book with this title already exists" });         //Error message αμα δεν
        } else {
            const insertQuery = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)';
            db.run(insertQuery, [newBook.author, newBook.title, newBook.genre, newBook.price], function(err) {      //Το insert αμα ολα κομπλε
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    res.json({ "message": "success" });     //succes message
                }
            });
        }
    });
});

app.listen(3000, function() {                           //Για να το βλεπω να ειμαι συγουρος
    console.log('Server is listening on port 3000');
});