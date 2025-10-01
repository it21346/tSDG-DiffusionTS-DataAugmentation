updateButton('register-option');

loadContent('register-template');
document.getElementById('registerBtn').addEventListener('click', async function () {
    loadContent('register-template');
    updateButton('register-option');

});

document.getElementById('searchBtn').addEventListener('click', async function () {
    loadContent('search-template');
    updateButton('search-option');

});

function updateButton(activeOption) {
    // Get all option elements
    var options = document.querySelectorAll('.register-option, .search-option');
    
    // Check between the 2 whcih one to be active
    options.forEach(function (option) {
        option.classList.remove('active');
        resetStyles(option);
    });

    var activeElement = document.querySelector('.' + activeOption);
    if (activeElement) {
        activeElement.classList.add('active');
        applyActiveStyles(activeElement);
    }
}

function resetStyles(element) {
    element.style.position = '';
    element.style.width = '';
    element.style.height = '';
    element.style.backgroundColor = '';
    element.style.border = '';
    element.style.borderRadius = '';
    element.style.display = '';
    element.style.flexDirection = '';
    element.style.boxShadow = '';
    element.style.marginBottom = '';
}

function applyActiveStyles(element) {
    element.style.position = 'relative';
    element.style.width = '240px';
    element.style.height = '60px';
    element.style.backgroundColor = 'var(--secondary-color)';
    element.style.border = '2px solid var(--main-color)';
    element.style.borderRadius = '34px';
    element.style.display = 'flex';
    element.style.flexDirection = 'row';
    element.style.boxShadow = '4px 4px var(--main-color)';
    element.style.marginBottom = '70px';
}
function loadContent(templateId) {
    const template = document.getElementById(templateId);
    const content = template.content.cloneNode(true);
    document.getElementById('content').innerHTML = '';
    document.getElementById('content').appendChild(content);
}

// Register book
function registerBook() {
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const price = document.getElementById('price').value;

    // Field Checks (i know i did the checks on the client's side...)
    if (!author || author.length > 25) {
        document.getElementById('error').textContent = 'Author must be filled and not exceed 25 characters.';
        document.getElementById('error').style.display = 'block';
        return;
    }
    else if (!title || title.length > 40) {
        document.getElementById('error').textContent = 'Title must be filled and not exceed 40 characters.';
        document.getElementById('error').style.display = 'block';
        return;
    }
    else if (!genre || genre.length > 20) {
        document.getElementById('error').textContent = 'Genre must be filled and not exceed 20 characters.';
        document.getElementById('error').style.display = 'block';
        return;
    }
    else if (!price || isNaN(price)) {
        document.getElementById('error').textContent = 'Please only type a number for the Price.';
        document.getElementById('error').style.display = 'block';
        return;
    }   
    else {
        document.getElementById('error').style.display = 'none';
    }

    const book = { author, title, genre, price: parseFloat(price) };

    fetch('http://localhost:3000/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(book)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('error').textContent = data.error;
                document.getElementById('error').style.display = 'block';
            } else {
                document.getElementById('author').value = '';
                document.getElementById('title').value = '';
                document.getElementById('genre').selectedIndex = 0;
                document.getElementById('price').value = '';

                //alert(`Book registered successfully! ID: ${data.book.id}`);
        
                // Success message
                const success = `Book "${title}" registered Successfully`;
                document.getElementById('error').textContent = success;
                document.getElementById('error').style.color = 'green';
                document.getElementById('error').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('error').textContent = 'Failed to register book.';
            document.getElementById('error').style.display = 'block';
        });
}


// Search books
function searchBooks() {
    var keyword = document.getElementById('keyword-search').value;
    fetch(`http://localhost:3000/books/${keyword}`)
        .then(response => response.json())
        .then(data => {
            displayBookResults(data,keyword);
        })
    console.log(keyword)

}

// Display the results
function displayBookResults(bookResults, keyword) {
    const container = document.getElementById("bookResults");
    container.innerHTML = ""; 
    if (bookResults.length === 0) {
        const noBookFoundMessage = document.createElement("div");
        noBookFoundMessage.classList.add("book-not-found");
        noBookFoundMessage.textContent = `No Book Found with the title "${keyword}"`;
        container.appendChild(noBookFoundMessage);
    } else {
        // Show them based on a specific format
        bookResults.forEach(book => {
            const repeatCard = document.createElement("div");
            repeatCard.classList.add("repeat-card");

            repeatCard.innerHTML = `
                <div class="top-left">ID: ${book.id}</div>
                <div class="middle">Title: ${book.title}</div>
                <div class="top-right">Author: ${book.author}</div>
                <div class="bottom-left">Genre: ${book.genre}</div>
                <div class="bottom-right">Price: ${book.price}$</div>
            `;

            container.appendChild(repeatCard);
        });
    }
}



