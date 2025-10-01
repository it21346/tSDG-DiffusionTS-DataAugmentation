const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const PORT = 3000;

let db = new sqlite3.Database("books.sqlite", sqlite3.OPEN_READWRITE, (err)=>{
    if(err){
        console.log(err.message);
    }
    console.log("Database connection succeeded");
});

db.serialize(()=>{
    db.run(
        `CREATE TABLE IF NOT EXISTS books
            (
                id INTEGER PRIMARY KEY AUTOINCREMENT,              
                author VARCHAR(25) NOT NULL,
                title VARCHAR(40) NOT NULL,
                genre VARCHAR(20) NOT NULL,
                price REAL NOT NULL
            );
        `
        , (err)=>{
            if(err){
                console.log(err.message);
            }else{
                console.log("Table created or already exists");
            }
        });
});

app.use(cors({
    origin: "*"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/books/:keyword", function(req, res){
    const param = req.params.keyword;
    let query = "SELECT * FROM books WHERE title LIKE '%" + param + "%'";

    db.all(query, (err, rows)=>{
        if(err){
            res.status(500).json({ message: "Something went wrong when searching for the book" });
            return;
        }
        res.status(200).json(rows);
    });
});

app.post("/books/", function(req, res){
    let insert = 'INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)';
    const data = [req.body["author"], req.body["title"], req.body["genre"], req.body["price"]];

    console.log(data);

    db.run(insert, data, function(err) {
        if(err){
            res.status(500).json({message: "Something went wrong on book uploading"});
        }else{
            res.status(200).json({message: "Book uploaded"});
        }
    });
});

app.listen(PORT, ()=> {
    console.log("Server is listening at: http://localhost:" + PORT);
});