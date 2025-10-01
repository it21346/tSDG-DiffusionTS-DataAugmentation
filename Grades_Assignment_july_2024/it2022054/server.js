const express = require('express'); // Εισαγωγή του express framework`
const bodyParser = require('body-parser');   // Εισαγωγή του body-parser για τo JSON
const sqlite3 = require('sqlite3').verbose();   // Εισαγωγή και ενεργοποίηση του sqlite3
const cors = require('cors');   // Εισαγωγή του cors
const path = require('path');   // Εισαγωγή του path module για χειρισμό διαδρομών αρχείων
const app = express();  // Δημιουργία instance του express
const PORT = 3000;  // Ορισμός port που επικοινωνεί με τον server

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('books.sqlite'); // Σύνδεση με τη βάση δεδομένων SQLite

// Δημιουργία του πίνακα books , πίνακας που δόθηκε από την εκφώνηση 
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);
});

// Endpoint για προσθήκη βιβλίου
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;   ; //Ανάκτηση δεδομένων

    if (!author || !title || !genre || isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid input' });  // Επιστροφή σφάλματος 400 αν τα δεδομένα δεν είναι έγκυρα
    }

    const stmt = db.prepare('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)');
    stmt.run(author, title, genre, price, function (err) {  // Εκτέλεση της δήλωσης SQL
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to add book' }); // Επιστροφή μήνυμα σφάλματος 500 αν η εισαγωγή αποτύχει
        }
        res.json({ success: true, message: 'Book added successfully!' });   // Επιστροφή μήνυμα επιτυχίας αν η εισαγωγή ήταν επιτυχής
    });
    stmt.finalize();
});

// Endpoint για επιστροφή όλων των βιβλίων
app.get('/books', (req, res) => {
    let query = `SELECT * FROM books`;

    // Για ανάκτηση όλων των βιβλίων
    db.all(query, [], (err, rows) => {
        if (err) {
            // Σε περίπτωση σφάλματος, επιστροφή κωδικού σφάλματος και μηνύματος
            return res.status(500).json({ success: false, message: 'Failed to retrieve books' });
        }
        // Επιστροφή JSON με τα αποτελέσματα
        res.json(rows);
    });
});


// Endpoint για αναζήτηση βιβλίων με βάση κριτήριο και όρο αναζήτησης
app.get('/books/search/', (req, res) => {
    const { criteria, term } = req.query;

     // Έλεγχος για την ύπαρξη κριτηρίου και όρου αναζήτησης
    if (!criteria || !term) {
        return res.status(400).json({ success: false, message: 'Search criteria and term are required' });
    }

    // Εκτέλεση ερωτήματος SQL για αναζήτηση βιβλίων βάσει του κριτηρίου και του όρου
    let query = `SELECT * FROM books WHERE ${criteria} LIKE ?`;
    db.all(query, [`${term}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to search books' });
        }
        res.json(rows);
    });
});


// Endpoint για αναζήτηση βιβλίων βάσει keyword στον τίτλο
app.get('/books/:keyword', (req, res) => {
    const { keyword } = req.params;

    let query = `SELECT id, author, title, genre, price FROM books WHERE title LIKE ?`;
    db.all(query, [`%${keyword}%`], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to search books' });
        }
        res.json(rows);
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Έναρξη του server και παρακολούθηση του PORT 3000
app.listen(PORT, () => {
    console.log(`Srver is running on http://localhost:${PORT}`);
});