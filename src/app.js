const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const parentDirectory = path.join(__dirname, '..');
const hostname = '127.0.0.1';
const port = 3000;

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'landlord'
});

// Utility function to determine the content type based on file extension
function getContentType(filePath) {
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database');
});

// Create the HTTP server
const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? 'index.html' : req.url;
  const contentType = getContentType(filePath);

  if (req.url === '/map.html') {
    // Perform a query to fetch the required data
    connection.query('SELECT Address, X, Y FROM PROPERTIES', (error, results) => {
      if (error) {
        console.error('Error executing query: ', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results));
    });
    }
    else if (contentType === "image/png" || contentType === 'text/html' || contentType === 'text/javascript' || contentType === 'text/css') {
        const file = path.join(parentDirectory, filePath);
        fs.readFile(file, (err, content) => {
        if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('File not found');
            return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.end(content);
        });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
    });

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
