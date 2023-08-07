const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const url = require('url');
var xss = require("xss");
var formidable = require("formidable");
const { type } = require('os');


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

async function sendReviews(type, ord, pageNumber, recordsRequested, sanitizedPropertyID) {
  const offset = pageNumber * recordsRequested
  var order, reviews;
  if (ord === 'ascend')
    order = 'ASC';
  else if (ord === 'descend')
    order = 'DESC';
  

  if (type === 'date') {
    const query = `
      SELECT * 
      FROM Reviews 
      WHERE PropertyID IN (${sanitizedPropertyID})
      ORDER BY ID ${order}
      LIMIT ${recordsRequested}
      OFFSET ${offset} `;
    reviews = await executeQuery(query);
  } else if (type === 'rating') {
    const query = `
      SELECT * 
      FROM Reviews 
      WHERE PropertyID IN (${sanitizedPropertyID})
      ORDER BY Rating ${order}
      LIMIT ${recordsRequested}
      OFFSET ${offset}`;
    reviews = await executeQuery(query);
  }

  return reviews;
}

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

async function calculatePropertyTags(propID) {

  try {
    // Query propFullTags & sort in descending order
    const selectFullTagsQ = 'SELECT * FROM PropFullTags WHERE PropID = ? ORDER BY Count DESC;'  
    var propFullTags = await executeQuery(selectFullTagsQ, [
      propID,
    ]);

    // Query currentPropTags
    const currentTagsQ = 'SELECT * FROM PropertyTags WHERE PropertyID = ?';
    var propCurrentTags = await executeQuery(currentTagsQ, [
      propID,
    ]);

    var passedTags = [];
    const thresh = [1, 2, 5, 10, 20, 50];
    const tagsToTake = 3; 
    var tagsTaken = 0, curThresh = 0;
    // Filter out propFullTags into passedTags
    for (let i = 0; i < propFullTags.length; i++) {
      let tag = propFullTags[i];
      console.log(tag.TagID + ": " + tag.Count);
      console.log("thresh: " + curThresh);
      if (tag.Count >= thresh[curThresh]) {
        console.log(tag.TagID + ' and the count: ' + tag.Count);
        passedTags.push(tag.TagID);
        console.log(tag.TagID + ' has passed');
        tagsTaken++;
        if (tagsTaken+1 > tagsToTake) {  // Increment thresh if tagsTaken goes past its boundary, moving to next thresh level
          if (curThresh+1 < thresh.length) {
            curThresh++;
          }
          tagsTaken = 0;
        }
      } else {
        break;
      }
    }

    // update property tag column, update this later
      // Convert the passedTags array to a comma-separated string
    const tagsString = passedTags.map((tag) => tag).join(',');


      // Execute a query to update the Properties table with the tagsString
      const updateQuery = `
        UPDATE Properties
        SET Tags = ?
        WHERE ID = ?
      `;

      // Execute the update query with tagsString as the parameter
      console.log(tagsString);
      console.log(propID);
      await executeQuery(updateQuery, [tagsString, propID]);


    // Itr over passedtags and add missing passedTags from currentTags to addTags array
    const addTags = passedTags.filter((pTag) => { // PROBLEM HERE, FIX THIS!!!
      console.log(propCurrentTags);
      const pTagExists = propCurrentTags.some((cTag) => cTag.TagID === pTag);
      console.log('check: ' + pTag);
      if (pTagExists) {
        console.log('not adding: ' + pTag);
        return false;
      } else {
        console.log('adding: ' + pTag);
        return true;
      }
    });

    // Itr over currentTags and remove missing passedTags from currentTags to removeTags array
    const deleteTags = propCurrentTags.filter((cTag) => {
      const cTagExists = passedTags.some((pTag) => cTag.TagID === pTag);
      console.log(cTag);
      if (!cTagExists) {
        console.log('delete: ' + cTag.TagID);
        return true;
      }
    });
    

    // Insert the addTags into the currentPropTags table
    for (const tag of addTags) {
      console.log(tag);
      const checkQuery = 'SELECT COUNT(*) as count FROM PropertyTags WHERE PropertyID = ? AND TagID = ?';

      const [result] = await executeQuery(checkQuery, [propID, tag]);
 
      const count = result.count;
      
      if (count === 0) {
        const insertTagQ = 'INSERT INTO PropertyTags (PropertyID, TagID) VALUES (?, ?);';
        await executeQuery(insertTagQ, [propID, tag]);
        console.log('Value inserted successfully.');
      }
    } 



    // Delete the deleteTags from the currentPropTags table
    for (const tag of deleteTags) {

      const deleteTagQ = 'DELETE FROM PropertyTags WHERE PropertyID = ? AND TagID = ?;';
      await executeQuery(deleteTagQ, [propID, tag.TagID]);
    }
    
  } catch (error) {
    console.log(error);
  }
}

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  //const filePath = req.url === '/' ? 'index.html' : req.url;
  const parsedUrl = new URL(req.url, "http://127.0.0.1:3000") // change ip here later
  parsedUrl.pathname = parsedUrl.pathname === "/" || parsedUrl.pathname === "/property.html" ? '/index.html' : parsedUrl.pathname;
  const contentType = getContentType(parsedUrl.pathname);
  
  
  if (parsedUrl.pathname === '/map.html') {
    console.log(parsedUrl.searchParams);
    if (!parsedUrl.searchParams.has('ids')) { // check for bbox bounds too/existance
      // Perform a query to fetch the required data, right now i just send the entire table.
      try {
      const minX = parseFloat(parsedUrl.searchParams.get('minX'));
      const minY = parseFloat(parsedUrl.searchParams.get('minY'));
      const maxX = parseFloat(parsedUrl.searchParams.get('maxX'));
      const maxY = parseFloat(parsedUrl.searchParams.get('maxY'));


        // Your SQL query with the bounding box filter
        const query = `SELECT * FROM Properties
        WHERE X >= ? AND X <= ? AND Y >= ? AND Y <= ?`;
        const params = [minX, maxX, minY, maxY];

        const propResults = await executeQuery(query, params);

        const queryTag = `SELECT * FROM Tags`;

        const tagResults = await executeQuery(queryTag);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');

        var results = {
          propResults: propResults,
          tagList: tagResults
        }

        res.end(JSON.stringify(results));
      } catch (error) {
        handleQueryError(res, error);
      }
    }
    else {
      console.log("trying to refresh here");
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
          propReviews = await sendReviews('date', 'ascend', 0, 15, sanitizedID);
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
  else if (parsedUrl.pathname === '/getreviews.html') {

    if (parsedUrl.searchParams.has('type') && parsedUrl.searchParams.has('order') && parsedUrl.searchParams.has('pagenumb') && parsedUrl.searchParams.has('id')) {
      const sortType = parsedUrl.searchParams.get('type'); // santize all of this..
      const sortOrder = parsedUrl.searchParams.get('order');
      const sortPageNumb = parsedUrl.searchParams.get('pagenumb');
      const sortPropID = parsedUrl.searchParams.get('id');
      try {
        const reviews = await sendReviews(sortType, sortOrder, sortPageNumb, 15, sortPropID); // always send 15 for now.. maybe later change it to variable
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const responseData = {
          Reviews: reviews
        };
        res.end(JSON.stringify(responseData));
      } catch (error) {
        console.log('error sending reviews: ' + error);
      }
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('File not found');
        return;
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
        let propReviews;

        // Update property rating/count, tag count, and tag calculation
        try {
          // Get reviews data
          const query = `SELECT * 
          FROM Reviews 
          WHERE PropertyID IN (${sanitizedID})`;

          propReviews = await executeQuery(query);
          
          // Calculate sum & avg
          let revSum = 0, revCount;
          propReviews.forEach(function (rev) {
            revSum += parseInt(rev.Rating);
          });
          revCount = propReviews.length;
          let revAvg = revSum/revCount;


          // Get list of possible tags, also probably just do this once a day via some kind of timeout event
          const queryP = `SELECT * 
          FROM Tags`;
          const possibleTags = await executeQuery(queryP);

          // Update Property avgRating/count
          const updateQuery = `UPDATE Properties SET AvgRating = ?, RatingCount = ? WHERE ID = ?`;
          await executeQuery(updateQuery, [
            revAvg, revCount, sanitizedID
          ]);

          // Update PropFullTag tag count IF the tag EXISTS, if tag doesn't exist... create the tag with count = 1 
          const selectFullTagsQ = 'SELECT * FROM PropFullTags WHERE PropID = ? ORDER BY Count DESC;'  
          var propFullTags = await executeQuery(selectFullTagsQ, [
            sanitizedID,
          ]);

          const updateQueryT = `UPDATE PropFullTags SET Count = Count + 1 WHERE PropID = ? AND TagID = ?`;
          const insertQueryT = `INSERT INTO PropFullTags (PropID, TagID, Count) VALUES (?, ?, 1)`;
          const tagsArr = tags.split(",");
          for (const tag of tagsArr) {
            const trimmedTag = tag.trim();
            console.log(possibleTags);
            const matchingTag = possibleTags.find((t) => t.Title === trimmedTag);
            if (matchingTag) {
              const tagID = matchingTag.ID;
              const tagExists = propFullTags.some((pTag) => pTag.TagID === tagID);
              if (tagExists) {
                await executeQuery(updateQueryT, [sanitizedID, tagID]);
              } else {
                await executeQuery(insertQueryT, [sanitizedID, tagID]);
              }
            }
          }

          
        console.log('Updated review');
      } catch (error) {
        console.error('Error executing the statement:', error);
      }
      // Update TAGS
      calculatePropertyTags(sanitizedID);

      });
    }
  }
  else if (parsedUrl.pathname === '/submit-new-apartment') {
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
        const revName = xss(fields['name']);
        const title = xss(fields['title']);
        const text = xss(fields['text']);
        const tags = xss(fields['tags']);
        const bedrooms = parseInt(fields['bedrooms']);
        const bathrooms = parseInt(fields['bathrooms']);
        const rent = parseInt(fields['rent'], 10);
        const deposit = parseInt(fields['deposit'], 10);
        const term = xss(fields['term']);
        const address = xss(fields['address']);
        const sqfootage = parseInt(fields['sqfootage']);

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

        async function addressToLatLong(addr) {
          let nominAPI = `https://nominatim.openstreetmap.org/search?q=${addr}&format=json`;

          try {
            console.log(`trying to access ${nominAPI}`);
            const response = await fetch(nominAPI);
            const data = await response.json();
            console.log(data);
            if (data.length === 1) {
              const lat = parseFloat(data[0].lat);
              const long = parseFloat(data[0].lon);
              const name = data[0].display_name;

              return {lat, long, name};
            }
            return null;

            console.log(data);
          } catch (error) {
            console.log('Nominatim error:', error);
            return null;
          }
        }

        async function addressExistsInDB(n) {
          const query = 'SELECT COUNT(*) as count FROM Properties WHERE Address = ?';
          const result = await executeQuery(query, [n])
          
          console.log(result);
          return result[0].count > 0;
        }
        

        async function addressExists(addr) {
          let propertyCoordinates = await addressToLatLong(addr);
          return propertyCoordinates;
        }
        
        var propertyCoordinates = await addressExists(address);
        var aptAlreadyExistsInDB;
        if (propertyCoordinates != null)
          aptAlreadyExistsInDB = await addressExistsInDB(propertyCoordinates.name);
        else 
          aptAlreadyExistsInDB = true;
        if (propertyCoordinates === null || aptAlreadyExistsInDB) {
          handleError('Address not valid', 400);
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
        
        // Send a response to the client
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Received the form data');

        try {
                  
          // alright, i got lat/long, time to make apartment
          let query = `INSERT INTO Properties (Name, X, Y, Address, AvgRating, RatingCount, LeaseTerm, Nearby, BedRange, BathRange, SqFootageRange, PriceRange, Tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          let result = await executeQuery(query, [revName, propertyCoordinates.long, propertyCoordinates.lat, propertyCoordinates.name, rating, 1, term, 'none', bedrooms, bathrooms, sqfootage.toString(), rent.toString(), tags]);
          const createdPropID = result.insertId;

          let queryReviewIns = `INSERT INTO Reviews (PropertyID, ReviewerName, Rating, Title, Text, Tags, Bedrooms, Bathrooms, Rent, Deposit, LeaseTerm, Date)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE())`; // date needs to be the current date!

          await executeQuery(queryReviewIns, [createdPropID, revName, rating, title, text, tags, bedrooms, bathrooms, rent, deposit, term]);

      
      } catch (error) {
          // Handle errors here
          console.error('Error inserting data:', error);
      }
      


        // alright after making apartment, i got the apartment id time to make a review attached to that apartID

      });
    }
  }
  else if (parsedUrl.pathname === '/search') {
    if (parsedUrl.searchParams.has('q')) {
      const userQuery = parsedUrl.searchParams.get('q');
      console.log('User is searching: ' + userQuery);

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(userQuery)}&format=json`);
        const data = await response.json();

        if (data.length > 0) {
          const boundingBox = data[0].boundingbox;
          const queryResult = {
            bottomLeft: {
              lat: parseFloat(boundingBox[0]),
              lon: parseFloat(boundingBox[2])
            },
            topRight: {
              lat: parseFloat(boundingBox[1]),
              lon: parseFloat(boundingBox[3])
            }
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(queryResult));
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('No results found for the query');
        }
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
        console.error(error);
      }
    } else {
      console.log('d');
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Bad Request: Missing query parameter');
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