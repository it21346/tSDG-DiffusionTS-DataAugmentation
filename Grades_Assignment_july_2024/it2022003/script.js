async function addBook() {
    const id = document.getElementById('id').value;
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const price = document.getElementById('price').value;

    const book = { id, author, title, genre, price };

    try {
        const response = await fetch('http://localhost:3000/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(book)
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Book added successfully with ID: ${result.id}`);
            document.getElementById('id').value = '';
            document.getElementById('author').value = '';
            document.getElementById('title').value = '';
            document.getElementById('genre').value = '';
            document.getElementById('price').value = '';
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function searchBookByKeyword() {
    const keyword = document.getElementById('keyword').value;

    try {
        const response = await fetch(`http://localhost:3000/books/${keyword}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const books = await response.json();
        if (response.ok) {
            let resultHtml = '<h3>Books Found</h3>';
            books.forEach(book => {
                resultHtml += `
                    <p><strong>ID:</strong> ${book.id}</p>
                    <p><strong>Title:</strong> ${book.title}</p>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Genre:</strong> ${book.genre}</p>
                    <p><strong>Price:</strong> ${book.price}</p>
                    <hr>
                `;
            });
            document.getElementById('searchResult').innerHTML = resultHtml;
        } else {
            document.getElementById('searchResult').innerHTML = '<p>No books found.</p>';
        }
    } catch (error) {
        document.getElementById('searchResult').innerHTML = '<p>There was an error processing your request.</p>';
        console.error('There was a problem with the fetch operation:', error);
    }
}

document.getElementById('addBookButton').addEventListener('click', addBook);
document.getElementById('searchButton').addEventListener('click', searchBookByKeyword);
