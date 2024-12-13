// Εισαγωγή των απαραίτητων βιβλιοθηκών
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const cors = require('cors');

// Ρύθμιση του CORS για να επιτρέπονται αιτήματα από οποιοδήποτε origin
app.use(cors({origin: "*"}));

// Ορισμός του καταλόγου 'front' ως στατικό για την εξυπηρέτηση στατικών αρχείων
app.use(express.static("front"));

// Χρήση του express.json() middleware για την ανάλυση JSON δεδομένων στο σώμα των αιτημάτων
app.use(express.json());

// Σύνδεση με τη βάση δεδομένων SQLite
const db = new sqlite3.Database('./books.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
    }
});


// Αρχικοποίηση της βάσης δεδομένων και δημιουργία του πίνακα 'books' αν δεν υπάρχει ήδη
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books  (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author VARCHAR(25) NOT NULL,
      title VARCHAR(40) NOT NULL,
      genre VARCHAR(20) NOT NULL,
      price REAL NOT NULL
    )`);
  });

// Endpoint για την αναζήτηση βιβλίου με βάση λέξη-κλειδί στον τίτλο
app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    // Εκτύπωση της λέξης-κλειδί για έλεγχο
    console.log(keyword);
    const query = `SELECT * FROM books WHERE title LIKE ?`;

    // Εκτέλεση του query στη βάση δεδομένων
    db.all(query, [`%${keyword}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Επιστροφή των αποτελεσμάτων αν βρεθούν βιβλία
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(500).json({err});
        }
    });
});

// Endpoint για την καταχώρηση νέου βιβλίου
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;

    // Εκτύπωση των ληφθέντων δεδομένων για έλεγχο
    console.log('Received data:', req.body);

    // Έλεγχος αν όλα τα απαιτούμενα πεδία είναι συμπληρωμένα
    if (!author || !title || !genre || !price) {
        res.status(400).json({ error: 'All fields (author, title, genre, price) are required' });
        return;
    }

    // Εκτέλεση του query για την εισαγωγή νέου βιβλίου στη βάση δεδομένων
    const query = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;

    db.run(query, [author, title, genre, price], function (err) {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Book added successfully:', { id: this.lastID, author, title, genre, price });
        
        // Επιστροφή επιβεβαίωσης ότι το βιβλίο προστέθηκε επιτυχώς
        res.json({
            message: `Book titled "${title}" by ${author} added successfully`,
            book: {
                id: this.lastID,
                author,
                title,
                genre,
                price
            }
        });
    });
});

// Εκκίνηση του διακομιστή στην καθορισμένη θύρα
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
