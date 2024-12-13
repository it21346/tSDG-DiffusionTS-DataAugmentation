document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Collect data from the form elements
        const author = document.getElementById('Author').value;
        const title = document.getElementById('Title').value;
        const price = document.getElementById('Price').value;
        const genre = document.getElementById('Genre').value;

        // Validate if the data is valid
        if (!author || !title || !genre || isNaN(price) || price <= 0) {
            alert('Please fill in all fields and provide a valid price.');
            return;
        }

        // Creating the object to be sent
        const book = {
            author: author,
            title: title,
            price: parseFloat(price),
            genre: genre
        };

        // Sending the request to the backend
        fetch('http://localhost:3000/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(book)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
            } else {
                alert('Failed to add the book.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding the book.');
        });
    });

    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const keyword = document.getElementById('keyword').value;

        fetch(`http://localhost:3000/books/${encodeURIComponent(keyword)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = '';

            if (data.length > 0) {
                data.forEach(book => {
                    const bookDiv = document.createElement('div');
                    bookDiv.className = 'book-result';
                    bookDiv.innerHTML = `
                        <h3>${book.title}</h3>
                        <p><strong>Author:</strong> ${book.author}</p>
                        <p><strong>Price:</strong> $${book.price}</p>
                        <p><strong>Genre:</strong> ${book.genre}</p>
                    `;
                    searchResults.appendChild(bookDiv);
                });
            } else {
                searchResults.innerHTML = '<p>No books found.</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while searching for books.');
        });
    });
});
