const sqlite3 = require('sqlite3').verbose();

// Σύνδεση στη βάση δεδομένων
let db = new sqlite3.Database('./books.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the books database.');
});

// Δημιουργία του πίνακα books
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author VARCHAR(25) NOT NULL,
        title VARCHAR(40) NOT NULL,
        genre VARCHAR(20) NOT NULL,
        price REAL NOT NULL
    )`, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Created books table.');
    });
});

// Κλείσιμο της σύνδεσης με τη βάση δεδομένων
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Closed the database connection.');
});
