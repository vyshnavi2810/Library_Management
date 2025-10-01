const exp = require('express');
const app = exp();
require('dotenv').config(); // process.env.PORT
const { MongoClient } = require('mongodb');
const path = require('path');

// Deploy React build in this server
app.use(exp.static(path.join(__dirname, "../client/build")));
// "../ means outside of the folder"
// join is a method in the path package which is used to connect frontend and backend. build of the frontend has to be connected

// To parse the body of the req
app.use(exp.json());

// Connect to database
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true })
  .then(client => {
    // Get db obj
    const fp = client.db('fieldproject');
    // Get collection obj
    const userCollection = fp.collection('usercollection');
    const lenderCollection = fp.collection('lendercollection');
    const booksCollection = fp.collection('bookscollection');
    // Share collection obj with express app
    app.set('userCollection', userCollection);
    app.set('booksCollection', booksCollection);
    app.set('lenderCollection', lenderCollection);
    // Confirm db connection status
    console.log("DB connection success");
  })
  .catch(err => console.log("Error in DB connection", err));

// Import API routes
const userApp = require('./APIs/user-api');
const lenderApp = require('./APIs/lender-api');
const adminApp = require('./APIs/admin-api');

// If path starts with user-api, send the req to userApp
app.use('/user-api', userApp);
// If path starts with admin-api, send req to adminApp
app.use('/admin-api', adminApp);
// If path starts with lender-api, send req to lenderApp
app.use('/lender-api', lenderApp);

// After connecting backend and frontend even if we refresh the page we will not get error
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// Express error handler
app.use((err, req, res, next) => {
  res.status(500).send({ message: "error", payload: err.message });
});

// Assign port number
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
