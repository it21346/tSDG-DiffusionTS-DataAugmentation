const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors({origin:"*"}));
app.use(express.static("frontendfile"));
const db = new sqlite3.Database('./books.sqlite');

// Create the books table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author VARCHAR(25) NOT NULL,
  title VARCHAR(40) NOT NULL,
  genre VARCHAR(20) NOT NULL,
  price REAL NOT NULL
)`);

// Get books by keyword in title
app.get('/books/:keyword', (req, res) => {
  const keyword = req.params.keyword;
  db.all('SELECT * FROM books WHERE title LIKE ?', [`%${keyword}%`], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new book
app.post('/books', (req, res) => {
  const { author, title, genre, price } = req.body;
  const sql = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)';
  db.run(sql, [author, title, genre, price], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Book added successfully', id: this.lastID });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
