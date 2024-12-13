Τεχνολογίες Εφαρμογών Ιστού
Εργασία 2024
Ιουλιανός Πολύζος

Για να τρέξετε την εφαρμογή ανοίγετε ένα τερματικό και με την εντολή cd πηγαίνετε στο φάκελο it2022091 που υπάρχουν τα αρχεία .js και ο φάκελος public και τα αρχεία .json .
Πληκτρολογείται στο τερματικό τις εντολές:
npm install body-parser
npm install cors
npm install express
npm install sqlite3

Ύστερα την εντολή: node server.js

Ανοίγετε ένα browser και βάζετε την διεύθυνση: http://localhost:3000


Το project περιέχει τα εξής αρχεία:
books.sqlite : Η βάση δεδομένων.
db.js : Τρέχει sql queries για τη δημιουργία του πίνακα και τη προσθήκη μερικών dummy entries στη βάση.
books.js : Τρέχει sql queries για τη προσθήκη βιβλίων που δίνονται από τον χρήστη στη βάση και την προβολή τους αναλόγως του αντίστοιχου keyword που θα δώσει ο χρήστης. Επίσης ελέγχει 
την ύπαρξη βιβλίων.
routes.js : Παρέχει δρομολογητές για την επικοινωνία με τη βάση δεδομένων και το χειρισμό POST και GET αιτημάτων 
server.js : Ανοίγει τον server και υποδεικνύει τη διεύθυνση URL.
Φάκελος public : Περιέχει το index.html και το style.css για τα εξωτερικά χαρακτηριστικά της εφαρμογής. Το index.html παρέχει δύο συναρτήσεις για την προσθήκη και την αναζήτηση βιβλίου.


Επιπλέον κώδικας που χρησιμοποιήθηκε από το Internet:

Στον κώδικα του αρχείου index.html:
Κώδικας: isNaN(price)
Πηγή : https://www.w3schools.com/jsref/jsref_isnan.asp

Κώδικας : Price: €${book.price.toFixed(2)}
Πηγή: https://www.w3schools.com/jsref/jsref_tofixed.asp

Στον κώδικα των αρχείων books.js και db.js χρησιμοποιήθηκε η παρακάτω ιστοσελίδα για καλύτερη κατανόηση των queries και τη σύνδεση με τη βάση: https://www.sqlitetutorial.net/sqlite-nodejs/ 

Στον κώδικα του αρχείου routes.js:
Χρησιμοποιήθηκε η διάλεξη του μαθήματος :
https://www.youtube.com/watch?v=cjz9DdrPIrA  

