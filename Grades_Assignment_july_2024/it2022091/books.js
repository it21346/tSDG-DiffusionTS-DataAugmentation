// Import the db.js module that contains the database connection
const db = require('./db');

// Function that checks if a book already exists in the database
const bookExists = (book) => {
    return new Promise((resolve, reject) => {
        // Book object 
        const { author, title, genre, price } = book;
        const query = 'SELECT COUNT(*) as count FROM books WHERE author = ? AND title = ? AND genre = ? AND price = ?';
        // Execute the query
        db.get(query, [author, title, genre, price], (err, row) => {
            if (err) {
                // If an error occurs during the database operation, reject the promise with the error
                reject(err);
            } else {
                // If the query is successful, resolve with true if the count is greater than 0 (indicating the book exists), otherwise resolve with false
                resolve(row.count > 0);
            }
        });
    });
};

// Function that retrieve books from database that their title contains the keyword given 
const getBooksByKeyword = (keyword) => {
    return new Promise((resolve, reject) => {
        // Query to select books based on the keyword
        const query = 'SELECT * FROM books WHERE title LIKE ?';
        // Execute the query
        db.all(query, [`%${keyword}%`], (err, rows) => {
            if (err) {
                reject(err);
            }else{
            // Resolve with the array of books retrieved from the database
            resolve(rows);
            }
        });
    });
};


// Function to add a book
const addBook = (book) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if the book already exists in the database
            const exists = await bookExists(book);
            if (exists) {
                // If so, resolve with a failure message
                resolve({ success: false });
            } else {
                // If not, run a SQL query to insert the book in the database
                const { author, title, genre, price } = book;
                const query = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)';
                db.run(query, [author, title, genre, price], function (err) {
                    if (err) {
                        // If an error occurs during the database operation, reject the promise with the error
                        reject(err);
                    }
                    else {
                    // Resolve with a success message
                    resolve({ success: true });
                    }
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};


// Export the functions to be used by other modules
module.exports = {
    getBooksByKeyword,
    addBook,
};
