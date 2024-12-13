// Αρχικοποιώ το βιβλίο και εισάγω το module του
const books = require('./books.js');
books.init();

// Εξαγωγή ενός αντικειμένου με μια συνάρτηση init 
module.exports = {
    init: function(app){
        app.get('/books/:keyword', async (req, res) => {
            try {
                const keyword = req.params.keyword;
                let result;
        
                if (!isNaN(keyword)) {
                    result = await books.searchBookById(parseInt(keyword));
                } else {
                    const price = parseFloat(keyword);
                    if (!isNaN(price)) {
                        result = await books.searchBooksByPrice(price);
                    } else {
                        result = await books.searchBooksByKeyword(keyword);
                    }
                }
        
                // Εάν βρεθεί αποτέλεσμα, μορφοποιήστε το και στείλτε το πίσω ως JSON
                if (result) {
                    if (Array.isArray(result)) {
                        const formattedResult = result.map(book => ({
                            id: book.id,
                            author: book.author,
                            title: book.title,
                            genre: book.genre,
                            price: book.price
                        }));
                        return res.json(formattedResult);
                    } else {
                        return res.json([result]);
                    }
                } else {
                    return res.status(404).json({ message: 'No books found.' });
                }
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        });               
        
        // Ορίστε ένα POST route για την προσθήκη νέων βιβλίων
        app.post('/books', async (req, res) => {
            const book = req.body;
            try {
                const exists = await books.bookExists(book);
                if (exists) {
                    return res.status(400).json({ message: 'Book is already added.' });
                }

                const result = await books.addBook(book);
                if (result === 'OK') {
                    res.status(200).json({ message: "Book added successfully!" });
                } else {
                    res.status(500).json({ message: 'Error adding book to database.' });
                }
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        });
    }
};
