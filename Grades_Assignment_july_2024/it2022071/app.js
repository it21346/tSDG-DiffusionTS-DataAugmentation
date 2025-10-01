
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('books.sqlite');

app.use(express.static(path.join(__dirname)));
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON bodies


app.get('/books/:keyword', function(req,res){

  const keyword = req.params.keyword;
  const query = `select * from books where title like?`;
  db.all(query,[`%${keyword}%`],function(err,row){
    if(err) {
      console.error("you got me. " + err);
      res.sendStatus(500);
    } else {
      res.json(row);
    }
  });

});

app.post('/books', function(req, res) {      // inserting new book
  
  const newBook = req.body;

  const query = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)';
  
  db.run(query, [newBook.author, newBook.title, newBook.genre, newBook.price], function(err) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else {
      res.json({ "message": "success" });
    }
  });
});
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.listen(3000);