const express = require('express');
const app = express();
app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

db.run(`CREATE TABLE IF NOT EXISTS books (

id INTEGER PRIMARY KEY AUTOINCREMENT,

author VARCHAR(25) NOT NULL,

title VARCHAR(40) NOT NULL,

genre VARCHAR(20) NOT NULL,

price REAL NOT NULL

);`);

app.get('/books/:keyword',function(req,res){
    const keyword = req.params.keyword;
    const query = `SELECT * FROM books WHERE title LIKE "%${keyword}%"`;
    db.all(query,function(err,row){
    if(err){
        res.status(500).json({message: 'Error',error: err.message });
    } else {
        res.json(row);
        res.end();
    }});
});

app.post('/books',function(req,res){
    const new_book = req.body;
    const query = `insert into books (author, title, genre, price) values ("${new_book.author}","${new_book.title}","${new_book.genre}","${new_book.price}")`;
    db.run(query,function(err){
        if(err){
            console.error(err);
            res.status(500).json({message: 'Error',error: err.message });
        }else{
            res.json({"message":"success"});
            res.end();
        }
    });
});
app.listen(3000);