const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); // Προσθήκη του path module

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));  // Προσθήκη του φακέλου 'public' για στατικά αρχεία

const db = new sqlite3.Database('./books.sqlite');

// Endpoint για την αρχική σελίδα
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint για αναζήτηση βιβλίων με βάση μια λέξη κλειδί
app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;

    db.all(`SELECT * FROM books WHERE title LIKE ?`, [`%${keyword}%`], (err, rows) => {
        if (err) {
            console.log(err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(rows);
    });
});

// Endpoint για καταχώρηση νέου βιβλίου
app.post('/books', (req, res) => {
    const { author, title, genre, price } = req.body;
    console.log('Received data:', req.body);  // Καταγραφή των δεδομένων που λαμβάνονται

    if (!author || !title || !genre || !price) {
        console.log('Missing required fields');
        res.status(400).json({ error: 'Όλα τα πεδία είναι υποχρεωτικά.' });
        return;
    }

    db.run(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`, [author, title, genre, price], function(err) {
        if (err) {
            console.log('Database error:', err.message);  // Καταγραφή του σφάλματος της βάσης δεδομένων
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ message: 'Το βιβλίο καταχωρήθηκε με επιτυχία.' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
