const url = window.origin+'/books/';


//Function to display Home, Add Book and Search Book in the input area

function showHome(event) {
    event.preventDefault(); // Prevents the default form submission behavior
    document.getElementById("AddBook").style.display = "none";
    document.getElementById("SearchBook").style.display = "none";
    document.getElementById("Home_Page").style.display = "block";
}

function showAddBook(event) {
    event.preventDefault();
    document.getElementById("Home_Page").style.display = "none";
    document.getElementById("SearchBook").style.display = "none";
    document.getElementById("AddBook").style.display = "block";
}

function showSearchBook(event) {
    event.preventDefault();
    document.getElementById("Home_Page").style.display = "none";
    document.getElementById("AddBook").style.display = "none";
    document.getElementById("SearchBook").style.display = "block";
}

//---------------------------------------------- Add Book --------------------------------------------------------------------//
document.getElementById('addBookForm').addEventListener('submit', async function addBook(evt) {
    evt.preventDefault(); 

    //Get the data from the form
    const bookAuthor = document.getElementById('author').value;
    const bookTitle = document.getElementById('title').value;
    const bookGenre = document.getElementById('genre').value;
    const bookPrice = document.getElementById('price').value;
    
    const newBook = {
        author: bookAuthor,
        title: bookTitle,
        genre: bookGenre,
        price: bookPrice
    };

    console.log("Sending data:", newBook); // Debugging line

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook)
        });

        const result = await response.json();

        if (response.ok) {
            customAlert(result.message); // Custom alert that shows with message that the book was added
            document.getElementById('addBookForm').reset(); //reset the form
            showAddBook(evt);
        } else {
            customAlert(result.message); // Alert if book already exists
        }
    } catch (error) {
        console.error('Error:', error);
        customAlert('An error occurred. Please try again later.');
    }
});

//---------------------------------------------- End Add Book ------------------------------------------------------------------------//


//---------------------------------------------- Search Book -------------------------------------------------------------------------//
document.getElementById('SearchBookForm').addEventListener('submit', async function searchBook(evt) {
    evt.preventDefault(); // Prevent default form submission

    // Get the keyword from the form input
    const keyword = document.getElementById('keyword').value;

    try {
        const response = await fetch(`${url}${keyword}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const books = await response.json();
        displaySearchResults(books); // Function to display search results
        console.log('Books Found:', books); // Debugging line
        
    } catch (error) {
        console.error('Error:', error);
        customAlert('Failed to search for books. Please try again.');
    }
});

// Function to display search results
function displaySearchResults(books) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = ''; // Clear previous results

    if (!books || (Array.isArray(books) && books.length === 0)) { //If no books were found
        customAlert('No books were found'); //Alert that no book was found
        document.getElementById('SearchBookForm').reset();
        
    } else if (Array.isArray(books)) { 
        document.getElementById('searchResults').style.display = "block";
        customAlert('Books found!');

        //Store books globally to use them later
        window.books = books;

        books.forEach(book => { //For eeach of the book that were found
            const bookElement = createBookElement(book);
            searchResults.appendChild(bookElement);
        });

        //Add the clear button back to the results container
        const clearButton = document.createElement('input');
        clearButton.type = 'button';
        clearButton.id = 'clearButton';
        clearButton.value = 'Clear';
        searchResults.appendChild(clearButton);
        
        //Clear button to clear the books that were found if the user wants to search something else
        clearButton.addEventListener('click', function() {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            document.getElementById('SearchBookForm').reset();
        });
    } else {
        console.error('Unexpected response from server:', books);
        customAlert('Unexpected response from server');
        document.getElementById('SearchBookForm').reset();
    }
}

function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.classList.add('book-item');
    bookElement.innerHTML = `
        <p><strong>Title:</strong> ${book.title}</p>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Genre:</strong> ${book.genre}</p>
        <p><strong>Price:</strong> ${book.price}</p>
    `;
    return bookElement;
}



//---------------------------------------------- End Search Book ---------------------------------------------------------------------//


//---------------------------------------------- Alert Function ----------------------------------------------------------------------//

// Custom Alert Function Definition
function customAlert(message) {
    const dialogOverlay = document.getElementById('dialogoverlay');

    const dialogBox = document.getElementById('dialogbox');
    dialogOverlay.style.display = "block";
    dialogBox.style.display = "block";
    document.getElementById('dialogboxbody').innerHTML = message;
    document.getElementById('dialogboxfoot').innerHTML = '<button class="pure-material-button-contained" onclick="customAlert.ok()">OK</button>';
}

customAlert.ok = function () {
    document.getElementById('dialogbox').style.display = "none";
    document.getElementById('dialogoverlay').style.display = "none";
};
//---------------------------------------------- End Alert Function ------------------------------------------------------------------//

