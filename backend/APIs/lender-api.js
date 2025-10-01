const exp = require('express');
const lenderApp = exp.Router();
const expressAsyncHandler = require('express-async-handler');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

const verifyToken = require('../Middlewares/verifyToken');

// Middleware for lenderCollection and booksCollection objects
let lenderCollection;
let booksCollection;

lenderApp.use((req, res, next) => {
  lenderCollection = req.app.get('lenderCollection');
  booksCollection = req.app.get('booksCollection');
  next();
});

// Registration
lenderApp.post('/lender', expressAsyncHandler(async (req, res) => {
  // Get lender resource from client
  const newLender = req.body;

  // Check for duplicate user based on username
  const dbUser = await lenderCollection.findOne({ username: newLender.username });

  // If dbUser found in db
  if (dbUser != null) {
    res.send({ message: "Lender already exists" });
  } else {
    // Hash the password
    const hashedPassword = await bcryptjs.hash(newLender.password, 6);

    // Replace plain password with hashed password
    newLender.password = hashedPassword;

    // Create lender
    await lenderCollection.insertOne(newLender);

    // Send response
    res.send({ message: "Lender created" });
  }
}));

module.exports = lenderApp;

//lender login
lenderApp.post('/login',expressAsyncHandler(async(req,res)=>{
    //get author credentials
    const userCred=req.body;
    //verify author
    const dbUser=await lenderCollection.findOne({username:userCred.username})
    //if dbUser is null
    if(dbUser===null){
        res.send({message:"Invalid username"})
    }//if username is valid
    else{
        const status=await bcryptjs.compare(userCred.password,dbUser.password)
        //if passwords are not matched
        if(status===false){
            res.send({message:"Invalid password"})
        }
        else{
            //create JWT token
            const signedToken=jsonwebtoken.sign({username:dbUser.username},process.env.SECRET_KEY,{expiresIn:'1d'})
            //send token client as res
            res.send({message:"login successful",token:signedToken,user:dbUser})
        }
    }
}))

//get books of all lenders
lenderApp.get('/books/:username',verifyToken,expressAsyncHandler(async(req,res)=>{
    //get authors username from url
    const lenderName=req.params.username;
    //get all articles whose status is true
    let booksList=await booksCollection.find({username:lenderName}).toArray()
    //send res
    res.send({message:"books",payload:booksList})
}))


//adding article by author
lenderApp.post('/book',verifyToken,expressAsyncHandler(async(req,res)=>{
    //get new article from client
    const newArticle=req.body;
    // console.log(newArticle)
    //duplicate article not possible beacuse only one article at one timestamp
    //post to articles collection
    await booksCollection.insertOne(newArticle)
    //send res
    res.send({message:"new book added"})
}))

//modify article by author
lenderApp.put('/book',verifyToken,expressAsyncHandler(async(req,res)=>{
    //get modified article from client
    const modifiedBook=req.body;
    //update by articleId
    let result=await booksCollection.updateOne({bookId:modifiedBook.bookId},{$set:modifiedBook})
    console.log(result)
    res.send({message:"book modified"})
}))

//soft delete of an article by author
lenderApp.put('/book/:bookId',verifyToken,expressAsyncHandler(async(req,res)=>{
    //get articleId from url
    const bookIdFromUrl=(+req.params.bookId);
    //get article
    const bookToDelete=req.body;

    if(bookToDelete.status===true){
       let modifiedBook= await booksCollection.findOneAndUpdate({bookId:bookIdFromUrl},{$set:{...bookToDelete,status:false}},{returnDocument:"after"})
       res.send({message:"Book deleted",payload:modifiedBook.status})
    }
    if(bookToDelete.status===false){
        let  modifiedBook= await booksCollection.findOneAndUpdate({bookId:bookIdFromUrl},{$set:{...bookToDelete,status:true}},{returnDocument:"after"})
        res.send({message:"book restored",payload:modifiedBook.status})
    }
    
}))

//export userApp
module.exports=lenderApp;