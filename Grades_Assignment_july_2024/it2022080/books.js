const sqlite3 = require('sqlite3').verbose();

module.exports = {

    // Αρχικοποίηση της σύνδεσης με τη βάση δεδομένων και δημιουργία του πίνακα βιβλίων αν δεν υπάρχει
    init: function(){
        this.db = new sqlite3.Database('books.sqlite');
        this.db.run(`CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT,
            title TEXT,
            genre TEXT,
            price REAL
        )`);
    },

    // Ελέγχω αν το βιβλίο προυπάρχει στη βάση δεδομένων
    bookExists: function(book) {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM books WHERE author = ? AND title = ?`;
            this.db.all(q, [book.author, book.title], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.length > 0);
                }
            });
        });
    },

    // Προσθήκη καινούριου βιβλίου στη βάση δεδομένων
    addBook: function(book){
        return new Promise((resolve, reject) => {
            const q = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`;
            this.db.run(q, [book.author, book.title, book.genre, book.price], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve("OK");
                }
            });
        });
    },

    // Αναζήτηση βιβλίου βάσει του αριθμού του
    searchBookById: function(id) {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM books WHERE id = ?`;
            this.db.get(q, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Αναζήτηση βιβλίου βάσει της τιμής του
    searchBooksByPrice: function(price) {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM books WHERE price = ?`;
            this.db.all(q, [price], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Αναζήτηση βιβλίων βάσει λέξης-κλειδιού (συγγραφέα, τίτλος ή είδος)."
    searchBooksByKeyword: function(keyword) {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM books WHERE author LIKE ? OR title LIKE ? OR genre LIKE ?`;
            this.db.all(q, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Αναζήτηση βιβλίου βάσει του είδος του
    searchBooksByGenre: function(genre) {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM books WHERE genre = ?`;
            this.db.all(q, [genre], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

};
