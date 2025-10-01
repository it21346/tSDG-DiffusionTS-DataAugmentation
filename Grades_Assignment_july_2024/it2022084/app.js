
//link to the sqlite3 package
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.db');

//create a class to represent a book
class Book {
    constructor(id,author, title, genre, price) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.genre = genre;
        this.price = price;
    }
}

//add a book
function addBook(db, book) {
    try{
     db.run(`INSERT INTO books (author,title,genre,price) VALUES ('${book.author}','${book.title}','${book.genre}',${book.price})`);
    } catch(err){
        throw err;
    }
}

//get all books from the database
async function getAllBooks(db) {
    const q = 'select * from books';
    const rows = await runQuery(db,q);
    books = [];
    for (row of rows) {
        book = new Book(row.id, row.author, row.title, row.genre, row.price);
        books.push(book);
    }
    return books;
}
/*
async function getBooksById(db,id){
    const q = 'select * from books where rowid='+id;
    const rows = await runQuery(db,q);
    books = [];
    for (row of rows) {
        book = new Book(row.id, row.author, row.title, row.genre, row.price);
        books.push(book);
    }
    return books;
}

async function getBooksByAuthor(db,author){
    const q = `SELECT * FROM books WHERE author LIKE '%${author}%'`;
    const rows = await runQuery(db,q);
    books = [];
    for (row of rows) {
        book = new Book(row.id, row.author, row.title, row.genre, row.price);
        books.push(book);
    }
    return books;
}
*/
//get a book by title
async function getBooksByTitle(db,title){
    const q = `SELECT * FROM books WHERE title LIKE '%${title}%'`;
    const rows = await runQuery(db,q);
    books = [];
    for (row of rows) {
        book = new Book(row.id, row.author, row.title, row.genre, row.price);
        books.push(book);
    }
    return books;
}

//run a query
function runQuery(db,q){
    return new Promise((resolve,reject)=>{
        db.all(q,(err,rows)=>{
            if(err){
                console.log('Error accessing the DB.');
                reject(err);
            }
            resolve(rows);
        });
    });   
}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/books',async(req,res)=> {
    try{
         //call getAllBooks to get all books from the database
        const books = await getAllBooks(db);
         //send the books as a JSON response
        res.json(books);
    } catch(err){
        res.status(500).send(err);
    }
});
/*
app.get('/books/:id',async(req,res)=> {
    try{
        const id = req.params.id;
        const book = await getBooksById(db,id);
        res.json(book);
    } catch(err){
        res.status(500).send(err);
    }
});

app.get('/books/:author',async(req,res)=> {
    try{
        const id = req.params.id;
        const book = await getBooksByAuthor(db,author);
        res.json(book);
    } catch(err){
        res.status(500).send(err);
    }
});
*/
app.get('/books/:title',async(req,res)=> {
    try{
        const title = req.params.title;
        //call getBooksByTitle function to get books that suit the title
        const book = await getBooksByTitle(db,title);
        //send the found books as a JSON response
        res.json(book);
    } catch(err){
        res.status(500).send(err);
    }
});

app.post('/books',(req,res)=>{
    const book = req.body;
    //log the inserted book
    console.log(req.body);
    try{
        //call addBook function to add the book to the database
        addBook(db, book);
    }catch(err){
        res.status(500).send(err);
    }
    
});

//http request to port '3000' 
app.listen(3000);



async function main(){ 

    try{
        const result = await getAllBooks(db); 
        console.log(result);
    }catch(err){
        console.error(err.message);
    }
}

//main();