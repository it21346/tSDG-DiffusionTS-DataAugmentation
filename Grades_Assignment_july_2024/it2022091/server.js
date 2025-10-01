// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { configure } = require('./routes');


const app = express();
app.use(express.static('public'));

// Define the port number on which the server will listen
const PORT = 3000;


// Use body-parser middleware to parse JSON requests
app.use(cors()); 

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

configure(app);


// Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
