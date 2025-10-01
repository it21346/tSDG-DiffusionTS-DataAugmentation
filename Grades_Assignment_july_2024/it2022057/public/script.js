// define the base URL 
const url = window.origin + '/books/';

// event listener for the button with id "addButton"
document.getElementById('addButton').addEventListener('click', async function (event) {
    event.preventDefault();

    // extract values from the form fields
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const price = parseFloat(document.getElementById('price').value);

    // checks the price input
    const priceError = document.getElementById('priceError');
    if (isNaN(price) || price <= 0) {
        // show error message if price invalid
        priceError.style.display = 'block';
        return;
    } else {
        // hide the error message if price is valid
        priceError.style.display = 'none';
    }

    // new book object getting added
    const newBook = {
        "author": author,
        "title": title,
        "genre": genre,
        "price": price
    }

    // clear the form fields 
    clearForms('addBookForm');

    try {
        // send a POST request to add new book
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json", // of type json
            },
            body: JSON.stringify(newBook), // converts the book object to json format
        });

        console.log(await response.json());
        // handle the response based on the status code
        if (response.status == 409) {
            alert('This book already exists');
        } else {
            if (response.status == 200) {
                alert('Your book has successfully been registered in our database');
            } else {
                alert('Failed to add book');
            }
        }
    } catch (err) {
        console.error(err);
        alert('Failed to add book');
    }
});


// event listener for the button with id "searchButton"
document.getElementById('searchButton').addEventListener('click', async function (event) {
    event.preventDefault();

    // extract the keyword from the form field
    const keyword = document.getElementById('keyword').value;

    try {
        // send a GET request to search for books containing the keyword in their titles
        const response = await fetch(`${url}${keyword}`);
        const books = await response.json();
        // get the 'Search results' section
        const result = document.getElementById('results');

        result.innerHTML = ''; // clear previous search results

        // Clear the form fields after search
        clearForms('searchBookForm');

        // if no books were found. display the according message
        if (books.message === 'No match found!') {
            result.textContent = 'No books found :(';
            alert("Book does not exist :(");
            return;
        }

        // Display the results as JSON
        for (const book of books) {
            const bookJson = JSON.stringify(book, null, 3); // Convert the book object to a formatted JSON string
            const bookElement = document.createElement('pre'); // Create a preformatted text element
            bookElement.textContent = bookJson; // Set the text content to the JSON string
            result.appendChild(bookElement); // Append the element to the results container
        }
        alert('You will find the results of your search in the "Search Results" section!');
    } catch (err) {
        console.error(err);
    }
});

/**
 * Clears the input fields of the specified form by its ID.
 * @param {string} form - The ID of the form to reset.
 */
function clearForms(form) {
    const cForm = document.getElementById(form);
    cForm.reset();
}