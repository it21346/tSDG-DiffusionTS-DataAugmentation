//κώδικας από τα εργαστήρια αλλά για βιβλίο
class Book {

    constructor(db){
        this.id = 0;
        this.title = '';
        this.author = '';
        this.price = 0;
        this.genre = '';
        this.db = db;
    }

    registerBook(newBook){
        const query = `insert into books values (${newBook.id},"${newBook.title}","${newBook.author}",${newBook.price},"${newBook.genre}")`;
        return new Promise((resolve,reject)=>{
            this.db.exec(query,function(err){
                if (err) {
                    reject(err);
                } else {
                    resolve({"message":"success"});
                }
            });
        });
    }

    searchByKeyword(keyword){
        const query = `select * from books where title like '%${keyword}%'`;
        return new Promise((resolve,reject)=>{
            this.db.all(query,function(err,row){
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getAllBooks(){
        const query = 'select * from books';
        return new Promise((resolve,reject)=>{
            this.db.all(query,function(err,rows){
                if (err){
                    reject(err);
                } else {
                    resolve({"message":"success"});
                }
            });
        });
    }

}

module.exports = Book;
