const { addBook, getBooksByKeyword, books } = require('./books');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.sqlite');

module.exports = {
    configure: function(app) {
        
        // Route to handle POST requests for adding a new book
        app.post('/books', async function(req, res) {
            try {
                // Extract the book information from the request body
                const book = req.body;
                // Add the book to the database
                const result = await addBook(book);
                // Check if the book was successfully added
                if (result.success) {
                    // If successful, respond with success
                    res.json({ success: true });
                } else {
                    // If unsuccessful, respond with failure and an error message
                    res.json({ success: false, message: result.message });
                }
            } catch (err) {
                // Handle any errors that may occur during the process
                console.error(err);
                res.status(500).send({ error: err.message });
            }
        });

        // Route to handle GET requests for retrieving books by keyword from database
        app.get('/books/:keyword', async function(req, res) {
            try {
                const keyword = req.params.keyword;
                //Retrieve books from database
                const enhancedBooks = await getBooksByKeyword(keyword);
                //Respond with books in json format
                res.json(enhancedBooks);
            } catch (err) {
                // Handle any errors that may occur during the process
                console.error(err);
                res.status(500).send({ error: err.message });
            }
        });

        app.get('/books', function (req, res) {
            // Define the SQL query to select all records from the 'books' table
            const query = 'SELECT * FROM books';
            // Execute the query
            db.all(query, function (err, rows) {
                if (err) {
                    // Log the error to the console
                    console.error(err);
                    // Send a 500 Internal Server Error response with the error message
                    res.status(500).json({ error: err.message });
                } else {
                    // If the query is successful, send the retrieved rows as a JSON response
                    res.json(rows);
                }
            });
        });
    }
};
