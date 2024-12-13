const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

//Using body parser to parse JSON requests...
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Connecting with the database!
const db = new sqlite3.Database('books.sqlite');

// Creating table and inserting initial data if doesn't exist!
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author VARCHAR(25) NOT NULL,
    title VARCHAR(40) NOT NULL,
    genre VARCHAR(20) NOT NULL,
    price REAL NOT NULL
  )`, [], (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      return;
    }

    // Checking if there are any data in the table...
    db.get('SELECT COUNT(*) AS count FROM books', (err, row) => {
      if (err) {
        console.error('Error checking table:', err.message);
        return;
      }

      // If the table is empty, inserting the initial data...
      if (row.count === 0) {
        db.run(`INSERT INTO books (author, title, genre, price) VALUES 
          ('J. R. R. Tolkien', 'Lord of the Rings', 'fantasy', 20.5),
          ('W. G. Sebald', 'The Rings of Saturn', 'fiction', 13.7)`, (err) => {
          if (err) {
            console.error('Error inserting initial data:', err.message);
          } else {
            console.log('Initial data inserted successfully.');
          }
        });
      }
    });
  });
});



// Endpoint to search books !
app.get('/books/:keyword', (req, res) => {
  const keyword = req.params.keyword;
  db.all(`SELECT * FROM books WHERE title LIKE ?`, [`%${keyword}%`], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to check server status!
app.get('/books', (req, res) => { 
  res.json({ status: "success" });    
});

// Endpoint to add a book!
app.post('/books', (req, res) => {
  const { author, title, genre, price } = req.body;

  // Checking the length !
  if (author.length > 25) {
    return res.status(400).json({ message: 'Author name cannot exceed 25 characters' });
  }
  if (title.length > 40) {
    return res.status(400).json({ message: 'Title cannot exceed 40 characters' });
  }

  const sql = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;
  db.run(sql, [author, title, genre, price], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Book added successfully', id: this.lastID });   
  });
});

// Route for the home page...
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


