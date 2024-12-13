const express = require('express'); //fortwnei to express module
const bodyParser = require('body-parser'); //fortwnei to body-parser gia na diavazei JSON swsta
const sqlite3 = require('sqlite3').verbose(); //fortwnei to sqlite3 module
const path = require('path');  //fortwnei to path gia ton xeirismo diadromwn

const app = express(); //dimiourgeitai to express app
const port = 3000; //orizw to port


app.use(bodyParser.json());//xrisimopoieitai to body-parser gia JSON
app.use(bodyParser.urlencoded({ extended: true })); //xrisimopoieitai to body-parser gia URL encoded dedomena


app.use(express.static(path.join(__dirname, 'public'))); //xrisimopoieitai to public directory gia static arxeia

//dimiourgw to database
const db = new sqlite3.Database('books.sqlite', (err) => { //anoigw thn bash books.sqlite
    if (err) { //elegxw an uparxei kapoio error

        console.error('Error opening database:', err.message); //se periptwsh pou uparxei error emfanizetai to antistoixo mhnuma error

    } else {

        db.serialize(() => {  //alliws an den uparxei error tote dhmiourgw ton pinaka books
            db.run(`CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            author VARCHAR(25) NOT NULL, 
            title VARCHAR(40) NOT NULL, 
            genre VARCHAR(20) NOT NULL, 
            price REAL NOT NULL 
        )`);

        //Eisagw kapoia dedomena(dummy entries)
        const stmt = db.prepare(`INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`);
        stmt.run('Sam', 'love', 'Action and Adventure', 10);
        stmt.run('liz', 'funny story', 'Satire', 8.99);
        stmt.run('George', 'it ends with us', 'Romance', 15);
        stmt.run('Kate', 'Dark', 'Horror', 12.5);
        stmt.finalize();//kanw finalize ta dedomena pou prosthesa

        console.log('Books table created and initial data inserted.'); //Emfanizei mhnuma pws o pinakas dimiourgithike kai ta arxika dedomena eisaxthikan swsta
        });
    }
});


app.get('/books/:keyword', (req, res) => { //orizetai ena route gia GET requests me keyword

    const keyword = req.params.keyword; //pairnei to keyword apo tis parametrous
    const query = `SELECT * FROM books WHERE title LIKE ?`; //anazhthsh stoixeiwn me bash to title

    db.all(query, [`%${keyword}%`], (err, rows) => {

        if (err) { //elegxw an uparxei kapoio error
            res.status(500).json({ error: err.message }); //epistrefetai error me status 500
            return;
        }

        res.json(rows); //epistrefei ta apotelesmata ws JSON
    });
});

app.post('/books', (req, res) => { //orizetai ena route gia POST requests gia thn prosthikh bibliwn

    const { author, title, genre, price } = req.body; //pairnei ta dedomena apo to body tou request
    const query = `INSERT INTO books (author, title, genre, price) VALUES (?, ?, ?, ?)`; //eisagwgh stoixeiwn ston pinaka

    db.run(query, [author, title, genre, price], function (err) {

        if (err) { //elegxw an uparxei kapoio error
            res.status(500).json({ error: err.message }); //epistrefetai error me status 500
            return;
        }

        res.json({ message: 'Book added successfully', id: this.lastID }); //epistrefetai mhnuma success kai to ID tou kainourgiou bibliou
    });
});


app.get('/', (req, res) => { //orizetai to route gia to root URL

    res.sendFile(path.join(__dirname, 'public', 'index.html')); //epistrefetai to index.html arxeio
});


app.listen(port, () => { //orizetai to server na akouei sto port 3000

    console.log(`Server running at http://localhost:${port}/`); //emfanizetai sto terminal oti to server trexei kanonika sto localhost:3000
});


//!!!SHMEIWSEIS:
//xrhsimopoihsa arketes phges gia na anaptuksw to sugkekrimeno programma kai gia na mporesw na to epilusw swsta.

//1.Stack Overflow : xrhsimopoihsa kapoies apanthseis apo stackoverflow gia sugkekrimena problhmata kai debugging(gia thn sundesh ths sqlite me to express,
//gia ta sql queries, kai gia na ruthmisw/xrhsimopoihsw to body-parser).

//2.Youtube tutorials apo diafora binteakia sxetika me ta RESTful APIs, to express kai thn sqlite.

//3.xrhsimopoihsa thn epishmh selida express kai sqlite(https://expressjs.com/) (https://www.sqlite.org/docs.html) gia thn dhmiourgia  twn routes kai tis entoles sql
//kai thn sundesh ths bashs dedomenwn.

//4.GitHub repositories gia idees kai paradeigmata kuriws.

//5. diafores alles istoselides apo to web opws px.freecodecamp.
