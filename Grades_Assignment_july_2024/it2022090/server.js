const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); 
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./books.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the books database.');
});

db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author VARCHAR(25) NOT NULL,
    title VARCHAR(40) NOT NULL,
    genre VARCHAR(20) NOT NULL,
    price REAL NOT NULL
)`);

app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    db.all(`SELECT * FROM books WHERE title LIKE ?`, [`%${keyword}%`], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json(rows);
    });
});

app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;
    const sql = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;
    db.run(sql, [author, title, genre, price], function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, author, title, genre, price }
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,  'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
