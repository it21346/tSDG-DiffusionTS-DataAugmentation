const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        tabPanes.forEach(pane => pane.classList.remove('active'));
        document.querySelector(`#${targetTab}`).classList.add('active');
    });
});


document.getElementById("register-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const book = {};

    // Collect form data
    for (const element of event.target.elements) {
        if (element.name && element.value) {
            book[element.name] = element.value;
        }
    }

    if (isNaN(book.price)) {
        alert("Price must be a number");
        return;
    }

    try {
        const response = await fetch('/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(book)
        });

        const data = await response.json();

        if (data.success) {
            alert("Book added successfully!");
            event.target.reset();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


document.getElementById("search-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const searchQuery = event.target.elements.search.value;

    try {
        const response = await fetch(`/books/${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (data.success) {
            displayResults(data.books);
        } else {
            alert("Failed to search books.");
        }
    } catch (error) { 
        console.error('Error:', error);
    }
});

function displayResults(results) {
    const container = document.getElementById('results-container');
    container.innerHTML = ''; // Clear the container to remove previous results

    if (results.length === 0) {
        container.innerHTML = '<p>No results found</p>';
        return;
    }

    results.forEach(book => {
        const item = document.createElement('div');

        // Create the new element and append it to the container
        item.className = 'result-item';
        item.innerHTML = `
            <p><strong>Title:</strong> ${book.title}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Genre:</strong> ${book.genre}</p>
            <p><strong>Price:</strong> ${book.price}€</p>
        `;
        container.appendChild(item);
    });
}
