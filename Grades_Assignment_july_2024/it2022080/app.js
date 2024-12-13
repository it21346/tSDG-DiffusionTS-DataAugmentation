const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Αρχικοποίηση της βάσης δεδομένων
const books = require('./books.js');
books.init(); 



// Δημιουργία της Express
const app = express();

// Αρχικοποίηση των routes
const routes = require('./routes.js');
routes.init(app);
// Route για την αρχική σελίδα
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Ρύθμιση των middleware
app.use(cors()); 
app.use(bodyParser.json());
app.use(express.static('public'));


// Route για προσθήκη νέου βιβλίου
app.post('/books', async (req, res) => {
    const book = req.body;
    try {
        const trimAuth = book.author.trim();
        const trimTitle = book.title.trim();
        const trimGenre = book.genre.trim();
        const trimPrice = book.price.trim();

        if (!trimAuth || !trimTitle || !trimGenre || !trimdPrice) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (isNaN(trimPrice)) {
            return res.status(400).json({ message: 'Price must be a number.' });
        }

        const result = await books.addBook({
            author: trimAuth,
            title: trimTitle,
            genre: trimGenre,
            price: parseFloat(trimPrice)
        });

        if (result === 'OK') {
            return res.status(200).json({ message: 'Book added successfully!' });
        } else {
            return res.status(500).json({ message: 'Error adding book to database.' });
        }
    } catch (err) {
        return res.status(500).send(err);
    }
});

// Ο server ξεκινάει
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
