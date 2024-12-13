const express = require('express');
const app = express();
app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const sqlite3 = require('sqlite3').verbose();
const db  = new sqlite3.Database("books.sqlite");

const Book = require('./book.js');
const book = new Book(db);

//register book
app.put('/books/', async function(req,res){
    const newBook = req.body;
    try {
        const result = await book.registerBook(newBook);
        res.json(result);
        res.end();
    } catch(err){
        console.error(err);
        res.sendStatus(500);
    }
});

//get book by id
app.get('/books/:keyword', async function(req,res){
    const keyword = req.params.keyword;
    try{
       const result = await book.searchByKeyword(keyword);
       res.json(result);
       res.end();
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

app.listen(3000);