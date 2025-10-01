    class Book {
        constructor(db) {
            this.author = '';
            this.title = '';
            this.genre = '';
            this.price = '';
            this.db = db;
        }

        addBook(newBook) {
            return new Promise((resolve, reject) => {
                const author = newBook.author.trim();
                const title = newBook.title.trim();
                const genre = newBook.genre.trim();
                const price = newBook.price;
                const query = `SELECT * FROM books WHERE LOWER(author)= "${author.toLowerCase()}" AND LOWER(title)="${title.toLowerCase()}"`; //Checks if book is already in the database. If it is, an alert pops up that say that the book already exists
                this.db.get(query, (err, row) =>{
                    if(err) {
                        return reject(err);
                    }
                    if(row) {
                        return reject(new Error('Book already exists'));
                    } else { // If its not already in the database, it adds it
                        const insertQuery = `INSERT INTO books (author, title, genre, price) VALUES("${author}", "${title}", "${genre}", ${price})`;
                        this.db.run(insertQuery, function(err) {
                            if(err) {
                                return reject(err);
                            }
                            resolve();
                        });
                }
                }); 
            });
        }


        


        searchBook(keyword) {
            const query = `SELECT * FROM books WHERE author LIKE '%${keyword}%' OR title LIKE '%${keyword}%'`; 
            return new Promise ((resolve, reject) => {
                this.db.all (query, function(err, row) {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }




    }

    module.exports = Book;
