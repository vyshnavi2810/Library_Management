const exp = require('express');
const userApp = exp.Router();
const expressAsyncHandler = require('express-async-handler');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
require('dotenv').config();
const verifyToken = require('../Middlewares/verifyToken');

// Middleware for userCollection and booksCollection objects
let userCollection;
let booksCollection;

userApp.use((req, res, next) => {
  userCollection = req.app.get('userCollection');
  booksCollection = req.app.get('booksCollection');
  next();
});

// User registration
userApp.post('/user', expressAsyncHandler(async (req, res) => {
  const newUser = req.body;
  const dbUser = await userCollection.findOne({ username: newUser.username });
  
  if (dbUser != null) {
    res.send({ message: "User already exists" });
  } else {
    const hashedPassword = await bcryptjs.hash(newUser.password, 6);
    newUser.password = hashedPassword;
    await userCollection.insertOne(newUser);
    res.send({ message: "User created" });
  }
}));


// User login
userApp.post('/login', expressAsyncHandler(async (req, res) => {
  const userCred = req.body;
  const dbUser = await userCollection.findOne({ username: userCred.username });
  
  if (dbUser === null) {
    res.send({ message: "Invalid username" });
  } else {
    const status = await bcryptjs.compare(userCred.password, dbUser.password);
    
    if (status === false) {
      res.send({ message: "Invalid password" });
    } else {
      const signedToken = jsonwebtoken.sign({ username: dbUser.username }, process.env.SECRET_KEY, { expiresIn: '1d' });
      res.send({ message: "login successful", token: signedToken, user: dbUser });
    }
  }
}));

// Get books of all lenders
userApp.get('/books', verifyToken, expressAsyncHandler(async (req, res) => {
  let booksList = await booksCollection.find({ status: true }).toArray();
  res.send({ message: "Books", payload: booksList });
}));

// Post comments for an article by article id
userApp.post('/comment/:articleId', verifyToken, expressAsyncHandler(async (req, res) => {
  const userComment = req.body;
  const articleIdFromUrl = req.params.articleId;
  let result = await booksCollection.updateOne(
    { articleId: articleIdFromUrl },
    { $addToSet: { comments: userComment } }
  );
  console.log(result);
  res.send({ message: "Comment posted" });
}));

//post comments for an article by article id
userApp.post('/comment/:articleId',verifyToken,expressAsyncHandler(async(req,res)=>{
  //get user comment obj
  const userComment=req.body;
  const articleIdFromUrl=req.params.articleId;
  //insert userComment obj to comments array of article by id
  let result=await articlescollection.updateOne(
     {articleId:articleIdFromUrl},
     {$addToSet:{comments:userComment}})
 console.log(result)
 res.send({message:"comment posted"})
 }))


// Export userApp
module.exports = userApp;
