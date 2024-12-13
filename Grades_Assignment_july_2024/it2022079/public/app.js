document.addEventListener('DOMContentLoaded', () => {
    const addBookForm = document.getElementById('addBookForm');
    const searchForm = document.getElementById('searchForm');
    const searchResults = document.getElementById('searchResults');
    const bookInfo = document.getElementById('bookInfo');

    const addBookLink = document.getElementById('addBookLink');
    const infoLink = document.getElementById('infoLink');
    const searchLink = document.getElementById('searchLink');

    const addBookBox = document.getElementById('addBookBox');
    const infoBox = document.getElementById('infoBox');
    const searchBox = document.getElementById('searchBox');

    addBookLink.addEventListener('click', () => {
        addBookBox.style.display = 'block';
        infoBox.style.display = 'none';
        searchBox.style.display = 'none';
        bookInfo.style.display = 'none';
    });

    infoLink.addEventListener('click', () => {
        addBookBox.style.display = 'none';
        infoBox.style.display = 'block';
        searchBox.style.display = 'none';
        bookInfo.style.display = 'none';
    });

    searchLink.addEventListener('click', () => {
        addBookBox.style.display = 'none';
        infoBox.style.display = 'none';
        searchBox.style.display = 'block';
        bookInfo.style.display = 'none';
    });

    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addBookForm);
        const author = formData.get('author');
        const title = formData.get('title');
        const genre = formData.get('genre');
        const price = formData.get('price');

        try {
            const response = await fetch('http://localhost:3000/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ author, title, genre, price })
            });
            const data = await response.json();
            alert(data.message);
            addBookForm.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Κάτι πήγε στραβά κατά την καταχώρηση του βιβλίου.');
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const keyword = searchForm.keyword.value.trim();

        try {
            const response = await fetch(`http://localhost:3000/books/${keyword}`);
            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Κάτι πήγε στραβά κατά την αναζήτηση του βιβλίου.');
        }
    });

    function displaySearchResults(books) {
        searchResults.innerHTML = '';

        if (books.length === 0) {
            searchResults.textContent = 'Δεν βρέθηκαν αποτελέσματα.';
            return;
        }

        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.classList.add('card');
            bookCard.innerHTML = `
                <h2>${book.title}</h2>
                <p>Συγγραφέας: ${book.author}</p>
                <p>Είδος: ${book.genre}</p>
                <p>Τιμή: €${book.price}</p>
            `;
            searchResults.appendChild(bookCard);
        });
        bookInfo.style.display = 'block';
    }
});
