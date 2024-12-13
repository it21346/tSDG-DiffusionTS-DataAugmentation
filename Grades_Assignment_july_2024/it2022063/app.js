//===================================================IMPORTS=====================================================
//Κάνουμε import την βιβλιοθήκη express για να φτιάξουμε το server
const express = require('express');
const app = express();
/*Ο server μπορεί να σερβίρει το αρχείο index.html στον client
γιατί το αρχείο βρίσκεται μέσα στο φάκελο public*/
app.use(express.static('public'));

//Κάνουμε import την βιβλιοθήκη sqlite3 για να χρησιμοποιήσουμε την βάση μας(books.sqlite)
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('books.sqlite');

//Κάνουμε import την βιβλιοθήκη body-parser για να μπορεί ο server να διαβάσει ως json το σώμα του HTTP request 
const bodyParser = require('body-parser');
app.use(bodyParser.json());
//===================================================IMPORTS=====================================================
//===================================================ΛΕΙΤΟΥΡΓΙΕΣ=================================================
//Καταχώρηση νέου βιβλίου όταν σταθλεί HTTP request με POST στο endpoint http://localhost:3000/books/
app.post('/books/',function(req,res){
    //Το newBook είναι το json object του βιβλιού και το bookID είναι 0
    const newBook = req.body;
    var bookID = newBook.id;

    /*Βρίσκουμε πόσα βιβλία υπάρχουν στην βάση και το πλήθος το προσθέτουμε στο bookID 
    έτσι ώστε το id του βιβλίου να είναι πάντα μοναδικό*/
    var query = `select count(*) as amountOfBooks from books`;
    db.get(query,function(err,row){
        //Αν υπάρχει σφάλμα κατα την εκτέλεση του query δηλαδή σφάλμα στην βάση
        if (err){
            console.error(err);
            res.sendStatus(500);
        }
        //Αυτό το bookID είναι πλέον μοναδικό
        bookID += row.amountOfBooks + 1;

        //Εισάγονται τα στοιχεία του βιβλίου στην βάση
        query = `insert into books values
            (${bookID},"${newBook.author}","${newBook.title}","${newBook.genre}",${newBook.price})`;
        db.exec(query,function(err){
            if (err){
                console.error(err);
                res.sendStatus(500);
            }else {
                //Η καταχώρηση του βιβλίου ήταν επιτυχής
                res.json({"message":"successful register"});
                res.end();
            }
        })
    })
})

//Αναζήτηση βιβλίου με λέξη κλειδί όταν σταθλεί HTTP request με GET στο endpoint http://localhost:3000/books/:keyword
app.get('/books/:keyword',function(req,res){
    //Το keyword είναι η είσοδος του χρήστη
    const keyword = req.params.keyword;

    //Επιλέγουμε τα βιβλία στα οποία το keyword περιέχεται στον τίτλο τους
    const query = `select * from books where title LIKE '%${keyword}%'`;
    db.all(query,function(err,rows){
        if (err){
            console.error(err);
            res.sendStatus(500);
        }else {
            //Επιστρέφεται ένα json που περιέχει ένα array από objects
            res.json(rows);
            res.end();
        }
    })
})
//===================================================ΛΕΙΤΟΥΡΓΙΕΣ=================================================

//Ο server ακούει στο port 3000 για HTTP requests
app.listen(3000);