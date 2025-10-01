const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('books.sqlite'); // Δημιουργία του αρχείου της βάσης στο οποίο θα αποθηκεύονται τα βιβλία

db.serialize(() => { // Δημιουργία του πίνακα books αν δεν υπάρχει
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`);
});

app.post('/books', (req, res) => { // Για προσθήκη βιβλίου
    const { author, title, genre, price } = req.body; // Παίρνει τα δεδομένα που έβαλε ο χρήστης

    if (!author || !title || !genre || isNaN(price) || price <= 0) {  // Αν οι εισαγωγές του χρήστη δεν είναι σωστές
        return res.status(400).json({ success: false, message: 'Invalid input' }); // Επιστροφή λάθους
    }

    const stmt = db.prepare('INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)'); // Προετοιμασία για την προσθήκη
    stmt.run(author, title, genre, price, function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to add book' }); // Επιστροφή λάθους
        }
        res.json({ success: true, message: 'Book added successfully!', id: this.lastID }); // Επιστροφή μηνύματος επιτυχίας
    });
    stmt.finalize();
});

app.get('/books/search', (req, res) => { // Για αναζήτηση βιβλίων
    const { type, term } = req.query; // Παίρνει το κριτήριο αναζήτησης και τη λέξι-κλείδι

    if (!type || !term) { // Αν οι εισαγωγές του χρήστη δεν είναι σωστές
        return res.status(400).json({ success: false, message: 'Search type and term are required' }); // Επιστροφή λάθους
    }

    const validTypes = ['author', 'title', 'genre', 'price']; // Τα σωστά κριτήρια αναζήτησης
    if (!validTypes.includes(type)) { // Αν δεν είναι σωστό το κριτήριο αναζήτησης του χρήστη
        return res.status(400).json({ success: false, message: 'Invalid search type' }); // Επιστροφή λάθους
    }

    let query = `SELECT * FROM books WHERE ${type} LIKE ?`; // Query σε SQL για την αναζήτηση του βιβλίου
    let searchTerm = `${term}%`; // Η λέξη-κλειδί

    if (type === 'price') { // Αν το κριτήριο αναζήτησης είναι η τιμή
        query = `SELECT * FROM books WHERE ${type} = ?`; // Query σε SQL για την αναζήτηση του βιβλίου με κριτήριο την τιμή
        searchTerm = term; // Η λέξη-κλειδί
    }

    db.all(query, [searchTerm], (err, rows) => { // Εκτέλεση του query
        if (err) { // Αν υπάρξει κάποιο λάθος
            return res.status(500).json({ success: false, message: 'Failed to retrieve books' }); // Επιστροφή λάθους
        }
        res.json(rows); // Επιστροφή των αποτελεσμάτων της αναζήτησης
    });
});

app.get('/books/:keyword', (req, res) => { // Για αναζήτηση βιβλίων με βάση το keyword
    const { keyword } = req.params; // Παίρνει την λέξη keyword 

    db.all('SELECT * FROM books WHERE title LIKE ?', [`%${keyword}%`], (err, rows) => { // Εκτέλεση query για αναζήτηση βιβλίου με βάση τη λέξη keyword
        if (err) { // Αν υπάρξει κάποιο λάθος
            return res.status(500).json({ success: false, message: 'Failed to retrieve books' }); // Επιστροφή λάθους
        }
        res.json(rows); // Επιστροφή των αποτελεσμάτων της αναζήτησης
    });
});

app.get('/books', (req, res) => { // Για εμφάνιση όλων των βιβλίων
    db.all('SELECT * FROM books', [], (err, rows) => { // Εκτέλεση query για εμφάνιση όλων των βιβλίων
        if (err) { // Αν υπάρξει κάποιο λάθος
            return res.status(500).json({ success: false, message: 'Failed to retrieve books' }); // Επιστροφή λάθους
        }
        res.json(rows); // Επιστροφή των αποτελεσμάτων της αναζήτησης
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => { // Έναρξη του server
    console.log(`Server is running. Click on: http://localhost:3000`);
});