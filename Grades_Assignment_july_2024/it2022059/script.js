//This function sends a POST request to add a new book to the database
async function addBook() {
    //Retrieve values from the input fields
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const price = document.getElementById('price').value;

    console.log('Sending POST request with data:', { author, title, genre, price });

    try {
        //Send a POST request to the server with the book data
        const response = await fetch('http://localhost:3000/books/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ author, title, genre, price })
        });

        //Parse the JSON response
        const result = await response.json();

        //Check if the request was successful
        if (response.ok) {
            alert(result.message); // Display a success message
        } else {
            console.error('Failed to add book:', result.message);
            alert(`Failed to add book: ${result.message}`); // Display an error message
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Failed to add book.'); // Display a generic error message
    }
}

//This function sends a GET request to search for books by a keyword
async function searchBook() {
    //Retrieve the search keyword from the input field
    const keyword = document.getElementById('search').value;

    console.log('Sending GET request with keyword:', keyword);

    try {
        //Send a GET request to the server with the search keyword
        const response = await fetch(`http://localhost:3000/books/${keyword}`);
        const books = await response.json();

        console.log('Books retrieved:', books);

        //Get the results div to display the search results
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';

        //Check if any books were found
        if (books.length > 0) {
            //Iterate over the books and create a div for each book
            books.forEach(book => {
                const bookDiv = document.createElement('div');
                bookDiv.innerHTML = `
                    <p><strong>ID:</strong> ${book.id}</p>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Title:</strong> ${book.title}</p>
                    <p><strong>Genre:</strong> ${book.genre}</p>
                    <p><strong>Price:</strong> ${book.price}€</p>
                    <hr>
                `;
                resultsDiv.appendChild(bookDiv); // Append the book div to the results div
            });
        } else {
            resultsDiv.innerHTML = '<p style="color: aliceblue">No books found.</p>'; // Display a message if no books were found
        }
    } catch (error) {
        console.error('Error searching books:', error);
        alert('Failed to search books.'); // Display a generic error message
    }
}
