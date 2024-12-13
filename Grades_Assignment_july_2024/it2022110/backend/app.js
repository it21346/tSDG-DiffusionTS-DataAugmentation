const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

let db = connectDatabase();
createTable(db);

//db.run('INSERT INTO books(author, title, genre, price) VALUES("a", "a", "a", 1)');
// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

//Render static files
app.use(express.static('frontend'));
// /books/ endpoint
// app.get("/", (req, res) => {
//     // res.sendFile(path.join(__dirname, "../frontend/index.html"));
//     // If you don't have an index.html, you can simply send a text response:
//     res.send("Welcome to the Books API!");
// });
app.post("/books", (req, res) => {
    const data = req.body;
    console.log(data);
    //author: 'a', title: 'a', genre: 'Science fiction', price: '11'
    db.run('INSERT INTO books(author, title, genre, price) VALUES(?, ?, ?, ?)', [data["author"], data["title"], data["genre"], data["price"]], (err) => {
        if(err){
            res.json({message: err.message});
        }else{
            res.json({message: "Success book inserted"});
        }
    })

});

app.get('/books/:keyword', (req, res) => {
    const keyword = req.params.keyword;

    db.all("SELECT * FROM books WHERE title LIKE '%" + keyword + "%'", (err, rows) => {
        if(err){
            console.log("Error retrieving data from database", err);
            res.json({message: err});
        }else{
            res.json(rows);
        }
    });
});

function connectDatabase(){
    let database = new sqlite3.Database("./books.sqlite", (err) => {
        if(err){
            console.log("Could not connect to database", err);
        }else{
            console.log("Connected to SQLite database");
        }
    });
    return database;
}

function createTable(database){
    let sql;
    //sql = "CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT,author VARCHAR(25) NOT NULL,title VARCHAR(40) NOT NULL,genre VARCHAR(20) NOT NULL,price REAL NOT NULL);"
    sql = "CREATE TABLE IF NOT EXISTS books (author VARCHAR(25) NOT NULL, title VARCHAR(40) NOT NULL, genre VARCHAR(20) NOT NULL, price REAL NOT NULL);"
    database.run(sql);
}

//Set server to listen at PORT
app.listen(PORT, ()=>{
    console.log("Server is listening at: http://localhost:%s", PORT);
});
