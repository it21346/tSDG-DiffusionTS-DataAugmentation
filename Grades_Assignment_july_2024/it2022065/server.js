const express = require('express');
const cors = require('cors')
const sqlite3 = require('sqlite3')
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const db = new sqlite3.Database('./books.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
const Book = require("./books.js");
const book = new Book(db);


async function TableCreation(){
  try{
    await book.CreateTable()
  }
  catch(err){
    console.log(err.message);
  }
}
TableCreation();

app.use(cors());
app.use(express.static(__dirname));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html')); // Serve the HTML file
});
app.post('/books',async function (req, res) {
  try{
    const result = await book.addBook(req.body);
    console.log(`A row has been inserted with rowid ${result}`);
    res.sendStatus(200);
  }
  catch(err){
    res.sendStatus(500);
    return console.log(err.message);
  }
})

app.get('/books/*', async function (req, res){
  try{
    const search = req.url.split('/').pop();
    const rows = await book.searchBook(search);
    res.send(rows);
  }
  catch(err){
    res.sendStatus(500);
    return console.log(err.message);
  }
})

var server = app.listen(3000, function () {
 const host = server.address().address;
 const port = server.address().port;
 console.log("Example app listening at http://%s:%s", host, port);
})