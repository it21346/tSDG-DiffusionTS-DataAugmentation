const b = document.getElementById("book_search");
//b for book
document.getElementById("post_form").addEventListener("submit", function (event) {
    

    let err = false;
    
    const error = document.getElementById("error_response");
    if(error.childElementCount > 0){
        for(let i=error.childElementCount - 1; i>=0; i--){
            error.removeChild(error.childNodes[i]);
        }
    }

    //elegxos gia response

    for(let i=0; i<form.length - 2; i++){
        let input = form[i].value;
        if(input == ""){
            event.preventDefault();

            err = true;

            const error = document.getElementById("error_response");
            error.style.visibility = "visible";

            const elem = document.createElement('h4');
            elem.style = 'color:red';
            const text = document.createTextNode("Error, check the field again");

            elem.appendChild(text);
            error.appendChild(elem);

            break;
        }
    }


    if(isNaN(form[3].value) || form[3].value <= 0){
        event.preventDefault();

        const Er = document.getElementById("error_response");
        
        err = true;

        Er.style.visibility = "visible";

        const elem = document.createElement('h4');
        elem.style = 'color:red';
        const text = document.createTextNode("Price cannot be accepted, check again");

        elem.appendChild(text);
        Er.appendChild(elem);
    }

    if(!err){
        fetch("http://localhost:3000/books", {
            method: 'POST',
            headers: {
                    "Content-Type": "application/json"
            },
            body: JSON.stringify({
                author: form[0].value,
                title: form[1].value,
                genre: form[2].value,
                price: form[3].value
            })
        }).then(res => { return res.json(); })
          .then(data => alert(data["message"]))
          .catch(error => alert(error))
    }
});

function display(data) {
    const tbl = document.getElementById("output_table");
    tbl.style.visibility = "visible";

    // Clear existing rows except the header
    while (tbl.rows.length > 1) {
        tbl.deleteRow(1);
    }

    // Add new rows from data
    data.forEach(item => {
        const tr = document.createElement("tr");

        const fields = ["author", "title", "genre", "price"];
        fields.forEach(field => {
            const td = document.createElement("td");
            td.textContent = item[field];
            tr.appendChild(td);
        });

        tbl.appendChild(tr);
    });
}

b.addEventListener("click", function(){
    const book = document.getElementById("search_bar");
    let err = false;

    const error = document.getElementById("error_response1");
    if(error.childElementCount > 0){
        for(let i=error.childElementCount - 1; i>=0; i--){
            error.removeChild(error.childNodes[i]);
        }
    }

    if(book.value == ""){
        const error = document.getElementById("error_response1");
        
        err = true;

        error.style.visibility = "visible";

        const elem = document.createElement('h4');
        elem.style = 'color:red';
        const text = document.createTextNode("Please provide a apropriate title");

        elem.appendChild(text);
        error.appendChild(elem);
    }

    if(!err){
        fetch("http://localhost:3000/books/" + book.value)
            .then(res => res.json())
            .then(data => display(data))
            .catch(error => alert(error))
    }

});


