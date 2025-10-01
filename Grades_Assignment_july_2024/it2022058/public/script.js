//is used to handle the process of changing scenes when different buttons are clicked
function showSection(sectionId) {
    document.getElementById('home').style.display = 'none';
    document.getElementById('new-submission').style.display = 'none';
    document.getElementById('search').style.display = 'none';

    document.getElementById(sectionId).style.display = 'block';

    if (sectionId === 'home') {
        document.getElementById('dataForm').reset();
        document.getElementById('searchForm').reset();
        document.getElementById('results').innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    showSection('home');
});

//handles the form input
const formElement = document.querySelector('.subForm');
formElement.addEventListener('submit', event => {
    event.preventDefault();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const genre = document.getElementById('genre').value.trim();
    const price = document.getElementById('price').value.trim();

    if (!title || !author || !genre || !price) {
        alert('Please fill in all fields.');
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    const book = {
        title: title,
        author: author,
        genre: genre,
        price: parseFloat(price)
    };


    fetch('/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(book)
    })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            if (result.bookId) {
                showSection('home');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

const searchFormElement = document.querySelector('#searchForm');
searchFormElement.addEventListener('submit', event => {
    event.preventDefault();


    const keyword = document.getElementById('keyword').value.trim();
    if (!keyword) {
        alert('Please enter a keyword to search.');
        return;
    }

    fetch(`/books/${keyword}`)
        .then(response => response.json())
        .then(results => {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = '';

            if (results.length === 0) {
                resultsContainer.textContent = 'No books found.';
                return;
            }

            results.forEach(book => {
                const bookElement = document.createElement('div');
                bookElement.classList.add('book');
                bookElement.innerHTML = `
                    <h3>${book.title}</h3>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Genre:</strong> ${book.genre}</p>
                    <p><strong>Price:</strong> $${book.price.toFixed(2)}</p>
                `;
                resultsContainer.appendChild(bookElement);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
