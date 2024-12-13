// Import the sqlite3 module
const sqlite = require('sqlite3').verbose();

// Define the source of the SQLITE db file
const DB_SOURCE = "books.sqlite";

// Open the SQLite database and initialize the 'db' variable
let db = new sqlite.Database(DB_SOURCE, function (err) {
    if (err) {
         // Log an error message if there is an issue opening the database
        console.error("Error opening database " + err.message);
    } else {
        // Run the SQL command to create the 'books' table if it doesn't already exist
        db.run(`CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL,
                title TEXT NOT NULL,
                genre TEXT NOT NULL,
                price REAL NOT NULL
            )`,
            (err) => {
                if (err) {
                    // Log an error message if there is an issue creating the table
                    console.error("Table creation error " + err.message);
                } else {
                     // Insert to table
                    const insert = 'INSERT INTO books (author, title, genre, price) VALUES (?,?,?,?)';
                    // Check if a book already exists in the table
                    const select = 'SELECT COUNT(*) as count FROM books WHERE author = ? AND title = ? AND genre = ? AND price = ?';
                    // Data for books 
                    const data1 = ["J. R. R. Tolkien", "Lord of the Rings", "fantasy", 20.5];
                    const data2 = ["W. G. Sebald", "The Rings of Saturn", "fiction", 13.7];
                    const data3 = ["David Peace", "Damned United" , "drama",14.5 ];
                    const data4 = ["David Simon", "Homicide" , "drama",18.3 ];
                    const data5 = ["Nikos Kazantazakis", "Kapetan Michalis" , "drama",15];


                    // Check if each book already exists
                    // If not, insert it into the table 
                    db.get(select, data1, (err, row) => {
                        if (err) {
                            console.error("Error checking data " + err.message);
                        } else {
                            if (row.count === 0) {
                                db.run(insert, data1);
                            }
                        }
                    });

                    db.get(select, data2, (err, row) => {
                        if (err) {
                            console.error("Error checking data " + err.message);
                        } else {
                            if (row.count === 0) {
                                db.run(insert, data2);
                            }
                        }
                    });
                    db.get(select, data3, (err, row) => {
                        if (err) {
                            console.error("Error checking data " + err.message);
                        } else {
                            if (row.count === 0) {
                                db.run(insert, data3);
                            }
                        }
                    });
                    db.get(select, data4, (err, row) => {
                        if (err) {
                            console.error("Error checking data " + err.message);
                        } else {
                            if (row.count === 0) {
                                db.run(insert, data4);
                            }
                        }
                    });
                    db.get(select, data5, (err, row) => {
                        if (err) {
                            console.error("Error checking data " + err.message);
                        } else {
                            if (row.count === 0) {
                                db.run(insert, data5);
                            }
                        }
                    });
                }
            });
    }
});

module.exports = db;


