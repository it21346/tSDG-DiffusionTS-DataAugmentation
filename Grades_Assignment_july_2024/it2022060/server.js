var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();
var port = 3000;
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(cors());

var db = new sqlite3.Database('books.sqlite');

db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT,
    title TEXT,
    genre TEXT,
    price REAL
)`);

app.post('/books/', function(req, res) {
    var author = req.body.author;
    var title = req.body.title;
    var genre = req.body.genre;
    var price = req.body.price;

    db.run('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)', [author, title, genre, price], function(err) {
        if (err) {
            res.json({ message: 'Failed to add book' });
        } else {
            res.json({ message: 'Book added successfully', id: this.lastID });
        }
    });
});

app.get('/books/:keyword', function(req, res) {
    var keyword = req.params.keyword;
    db.all('SELECT * FROM books WHERE title LIKE ?', ['%' + keyword + '%'], function(err, rows) {
        res.json(rows);
    });
});

app.listen(port, function() {
    console.log('Server running at http://localhost:' + port);
});
