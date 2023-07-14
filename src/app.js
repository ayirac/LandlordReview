const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const url = require('url');
var xss = require("xss");
var formidable = require("formidable");


const parentDirectory = path.join(__dirname, '..');
const hostname = '127.0.0.1';
const port = 3000;

// Create a MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'landlord',
  connectionLimit: 20,
});

// connection pool helper funcs
const handleQueryError = (res, error) => {
  console.error('Error executing query:', error);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Internal Server Error');
};

const executeQuery = async (query, params) => {
  const connection = await pool.promise().getConnection();

  try {
    const [results] = await connection.query(query, params);
    return results;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

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

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  //const filePath = req.url === '/' ? 'index.html' : req.url;
  const parsedUrl = new URL(req.url, "http://127.0.0.1:3000") // change ip here later
  parsedUrl.pathname = parsedUrl.pathname === "/" || parsedUrl.pathname === "/property.html" ? '/index.html' : parsedUrl.pathname;
  const contentType = getContentType(parsedUrl.pathname);
  
  
  if (parsedUrl.pathname === '/map.html') {
    if (!parsedUrl.searchParams.has('ids')) {
      // Perform a query to fetch the required data, right now i just send the entire table.
      try {
        const propResults = await executeQuery('SELECT ID, X, Y FROM Properties');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(propResults));
      } catch (error) {
        handleQueryError(res, error);
      }
    }
    else {
      const selectedIds = xss(parsedUrl.searchParams.get('ids')).split(',');
      if (selectedIds.length > 1) {
        // Perform a query to fetch the specific records based on the selected IDs
        const propertyIds = selectedIds.join(','); // sant via xss
        try { // SANTIZE HERE
          const query = `SELECT * 
          FROM Properties 
          WHERE ID IN (${propertyIds}) 
          ORDER BY FIELD(ID, ${propertyIds})`;

          const propSpecResults = await executeQuery(query);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(propSpecResults));
        } catch (error) {
          handleQueryError(res, error);
        }
      }
    }
  }
  else if (parsedUrl.pathname === '/getproperty.html') { // Send floorplan & property json data
    if (parsedUrl.searchParams.has('id')) {
      const id = parsedUrl.searchParams.get('id'); // sant via xss
      const sanitizedID = isNaN(id) ? -1 : id;

      if (sanitizedID === -1) { // reject any NaN invalid properties
        handleQueryError(res, "Invalid property ID");
      } else {   
        // Properties
        var propData = {}, propFpData = {}, propReviews = {}, possibleTags = [], propTags = [];
        try { 
          const query = `SELECT * 
          FROM Properties 
          WHERE ID IN (${sanitizedID}) 
          ORDER BY FIELD(ID, ${sanitizedID})`;

          propData = await executeQuery(query);
        } catch (error) {
          handleQueryError(res, error);
        }

        try {
          const query = `SELECT * 
          FROM FloorPlans 
          WHERE PropertyID IN (${sanitizedID}) 
          ORDER BY FIELD(ID, ${sanitizedID})`;

          propFpData = await executeQuery(query);
          } catch (error) {
            handleQueryError(res, error);
          }

        try { 
          const query = `SELECT * 
          FROM Tags`;

          possibleTags = await executeQuery(query);
        } catch (error) {
          handleQueryError(res, error);
        }
    
        try { 
          const query = `SELECT * 
          FROM PropertyTags 
          WHERE PropertyID IN (${sanitizedID})`;

          propTags = await executeQuery(query);
        } catch (error) {
          handleQueryError(res, error);
        }
        const tagNames = [];
        for (const tag of propTags) {
          for (const tagType of possibleTags) {
            if (tag.TagID === tagType.ID) {
              tagNames.push(tagType.Title);
            }
          }
        } 

        try {
          const query = `SELECT * 
          FROM Reviews 
          WHERE PropertyID IN (${sanitizedID})`;

          propReviews = await executeQuery(query);
          } catch (error) {
            handleQueryError(res, error);
        }

        const responseData = {
          FloorPlans: propFpData,
          PropertyData: propData,
          Tags: tagNames,
          PossibleTags: possibleTags,
          Reviews: propReviews
        };

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(responseData));
      }
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
  else if (parsedUrl.pathname === '/submit-review') {
    if (req.method === 'POST') {
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields) => {
        if (err) {
          console.error('Error parsing form data:', err);
          res.statusCode = 400;
          res.setHeader('Content-Typx`e', 'text/plain');
          res.end('Bad Request');
          return;
        }

        console.log(fields);

        // Mixture of XSS sanitizaton & input validation for ints/floats
        const rating = fields['rating'];
        const propID = parseInt(fields['propid']);
        const revName = xss(fields['name']);
        const title = xss(fields['title']);
        const text = xss(fields['text']);
        const tags = xss(fields['tags']);
        const bedrooms = parseInt(fields['bedrooms']);
        const bathrooms = parseInt(fields['bathrooms']);
        const rent = parseInt(fields['rent'], 10);
        const deposit = parseInt(fields['deposit'], 10);
        const term = xss(fields['term']);

        const sanitizedID = isNaN(propID) ? -1 : propID;
        const sanitizedBedrooms = isNaN(bedrooms) ? -1 : bedrooms;
        const sanitizedBathrooms = isNaN(bathrooms) ? -1 : bathrooms;
        const sanitizedRent = isNaN(rent) ? -1 : rent;
        const sanitizedDeposit = isNaN(deposit) ? -1 : deposit;

        const handleError = (errorMessage, statusCode) => {
          console.error(errorMessage);
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'text/plain');
          res.end(errorMessage);
        };
        
        if (title.length > 64) {
          handleError('Title length exceeds the limit', 400);
          return;
        }
        
        if (revName.length > 64) {
          handleError('Reviewer name length exceeds the limit', 400);
          return;
        }
        
        if (text.length > 5000) {
          handleError('Review text length exceeds the limit', 400);
          return;
        }
        
        if (tags.length > 255) {
          console.warn('Tags length exceeds the limit, truncating');
          tags = tags.substring(0, 255); // cut to 0-255
          tags = tags.substring(0, tags.lastIndexOf(' ')); // cut to last whole word
        }
        
        const validateValue = (value, minValue, maxValue, errorMessage) => {
          if (value < minValue || value > maxValue) {
            handleError(errorMessage, 400);
            return true;
          }
          return false;
        };
        
        if (validateValue(bedrooms, 0, 20, 'Invalid bedrooms value')) {
          return;
        }
        
        if (validateValue(bathrooms, 0, 20, 'Invalid bathrooms value')) {
          return;
        }
        
        if (validateValue(rent, 0, 15000.0, 'Invalid monthly rent value')) {
          return;
        }
        
        if (validateValue(deposit, 0, 15000.0, 'Invalid security deposit value')) {
          return;
        }
        
        const validTerms = ['N/A', 'Month to Month', '3 Months', '6 Months', 'Yearly'];

        if (!validTerms.includes(term)) {
          handleError('Invalid lease term', 400);
          return;
        }
        
        if (isNaN(rating) || rating < 1 || rating > 5) {
          handleError('Invalid rating value', 400);
          return;
        }
        
        if (sanitizedID === -1) {
          handleError('Invalid propertyID value', 400);
          return;
        }
        try {
          const insertQuery =
            'INSERT INTO Reviews (PropertyID, ReviewerName, Rating, Title, Text, Tags, Bedrooms, Bathrooms, Rent, Deposit, LeaseTerm, Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE())';
  
          await executeQuery(insertQuery, [
            sanitizedID,
            revName,
            rating,
            title,
            text,
            tags,
            sanitizedBedrooms,
            sanitizedBathrooms,
            sanitizedRent,
            sanitizedDeposit,
            term,
          ]);

          console.log('Inserted new review');
        } catch (error) {
          console.error('Error executing the statement:', error);

          if (error.message.includes('syntax') || error.message.includes('SQL')) {
            console.log('Potential SQL injection attack detected!');
          }
        }

        // Send a response to the client
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Received the form data');
      });
    }
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