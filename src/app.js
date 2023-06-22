const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const url = require('url');


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
    case '.jpg':
      return 'image/jpeg';
    case '.svg':
        return 'image/svg+xml';
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
  //const filePath = req.url === '/' ? 'index.html' : req.url;
  const parsedUrl = new URL(req.url, "http://127.0.0.1:3000") // change ip here later
  parsedUrl.pathname = parsedUrl.pathname === "/" ? '/index.html' : parsedUrl.pathname;
  const contentType = getContentType(parsedUrl.pathname);

  if (parsedUrl.pathname === '/map.html') {
    if (!parsedUrl.searchParams.has('ids')) {
      
      // Perform a query to fetch the required data
      connection.query('SELECT ID, Address, X, Y FROM PROPERTIES', (error, results) => {
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
    else {
      const selectedIds = parsedUrl.searchParams.get('ids').split(',');
      // Perform a query to fetch the specific records based on the selected IDs
      const propertyIds = selectedIds.join(',');
      const query = `SELECT PropertyID, HOA, View, Cost, AvgRating, Bathrooms, Bedrooms, Name, RatingCount 
                     FROM Attributes 
                     WHERE PropertyID IN (${propertyIds}) 
                     ORDER BY FIELD(PropertyID, ${propertyIds})`;
      connection.query(query, (error, results) => {
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
  }
  else if (parsedUrl.pathname === '/property.html') {
    ///property.html?id=
    if (parsedUrl.searchParams.has('id')) {
      let id = parsedUrl.searchParams.get('id');

      const query = `SELECT PropertyID, HOA, View, Cost, AvgRating, Bathrooms, Bedrooms, Name, RatingCount 
                     FROM Attributes 
                     WHERE PropertyID IN (${id}) 
                     ORDER BY FIELD(PropertyID, ${id})`;
      connection.query(query, (error, results) => {
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
  }
  else if (contentType === "image/png" || contentType === "image/jpeg" || contentType === "image/svg+xml" ||contentType === 'text/html' || contentType === 'text/javascript' || contentType === 'text/css') {
      const file = path.join(parentDirectory, parsedUrl.pathname);
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
  } 
  else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Not Found');
  }
});

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
