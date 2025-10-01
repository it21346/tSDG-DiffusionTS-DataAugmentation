class Book {
    constructor(db){
        this.title = '';
        this.author = '';
        this.genre = '';
        this.price = '';
        this.db = db;
    }

    CreateTable(){
        const query = "CREATE TABLE books(id INTEGER PRIMARY KEY AUTOINCREMENT,author VARCHAR(25) NOT NULL,title VARCHAR(40) NOT NULL,genre VARCHAR(20) NOT NULL,price REAL NOT NULL);";
        return new Promise((resolve,reject)=>{
            this.db.run(query, function(err){
                if (err) {
                    if(err.message = "SQLITE_ERROR: table books already exists"){
                      resolve();
                    }
                    else{
                        reject(err);
                    }
                }
                else{
                    resolve();
                }
            })
        });
    }

    addBook(book){
        const query = "INSERT INTO BOOKS (author, title, genre, price) VALUES(?,?,?,?)";
        return new Promise((resolve,reject)=>{
            this.db.run(query,[book.author, book.title, book.genre, book.price], function(err){
                if(err){
                    reject(err);
                }
                else{
                    resolve(this.lastID);
                }
            })
        })
    }

    searchBook(key){
        const query = "SELECT * FROM BOOKS WHERE ID = ? OR AUTHOR LIKE ? OR TITLE LIKE ?2 OR GENRE LIKE ?2";
        return new Promise((resolve,reject)=>{
            this.db.all(query,[key, '%'+key+'%'], function(err,rows){
                if(err){
                    reject(err);
                }
                else{
                    resolve(rows);
                }
            })
        })
    }
}

module.exports = Book;