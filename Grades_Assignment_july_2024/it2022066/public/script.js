// Event listener for form submission to add a new book
document.getElementById('book-form').addEventListener('submit', async (e) => {
    e.preventDefault();// Prevent the default form submission behavior

    // Extract book data from form inputs
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const price = parseFloat(document.getElementById('price').value);

    // Validate the price to ensure it's not negative
    if (price <= 0) {
        document.getElementById('entry-message').textContent = 'Error: Price cannot be negative or zero';
        return; // Prevent form submission
    }

    try {
        // Send a POST request to the server to add the new book
        const response = await fetch('http://localhost:3000/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, title, genre, price })
        });

        const result = await response.json();

        if (response.ok) {
            // Display the success message
            document.getElementById('entry-message').textContent = result.message;
            // Clear the success message after 5 seconds
            setTimeout(() => {
                document.getElementById('entry-message').textContent = '';
            }, 1000);
            // Clear form fields
            document.getElementById('book-form').reset();
        } else {
            // Display the error message
            document.getElementById('entry-message').textContent = `Error: ${result.message || result.error}`;
        }
    } catch (error) {
        // Handle any network errors
        document.getElementById('entry-message').textContent = `Network Error: ${error.message}`;
    }
});

// Event listener for search button to search for books
document.getElementById('search-button').addEventListener('click', async () => {
    const keyword = document.getElementById('search').value;

    try {
        // Send a GET request to the server to search for books by keyword
        const response = await fetch(`http://localhost:3000/books/${keyword}`);
        const books = await response.json();

        // Display the search results
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';
        if (books.length === 0) {
            resultsDiv.textContent = 'No Books Found';
        } else {
            books.forEach(book => {
                resultsDiv.innerHTML += `<p>${book.title} by ${book.author}, ${book.genre}, $${book.price}</p>`;
            });
        }
    } catch (error) {
        console.error('Failed to search books:', error);
        document.getElementById('results').textContent = `Network Error: ${error.message}`;
    }
});

// Function to handle tab switching
async function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });

    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'view-books') { //view books tab was selected

        try {
            // Send a GET request to the server to fetch all books
            const response = await fetch('http://localhost:3000/viewBooks');
            const books = await response.json();

            // Display all books
            const allBooksDiv = document.getElementById('all-books');
            allBooksDiv.innerHTML = '';
            if (books.length === 0) {
                allBooksDiv.textContent = 'No books available.';
            } else {
                books.forEach(book => {
                    allBooksDiv.innerHTML += `
            <p>
              ${book.title} by ${book.author}, ${book.genre}, $${book.price}
            </p>`;
                });
            }
        } catch (error) {
            console.error('Failed to fetch books:', error);
            document.getElementById('all-books').textContent = `Network Error: ${error.message}`;
        }
    }

}
