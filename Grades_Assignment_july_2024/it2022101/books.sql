 -- Run these commands in a SQLite client to create and populate the database
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author VARCHAR(25) NOT NULL,
  title VARCHAR(40) NOT NULL,
  genre VARCHAR(20) NOT NULL,
  price REAL NOT NULL
);

INSERT INTO books (author, title, genre, price) VALUES 
('J. R. R. Tolkien', 'Lord of the Rings', 'fantasy', 20.5),
('W. G. Sebald', 'The Rings of Saturn', 'fiction', 13.7);
