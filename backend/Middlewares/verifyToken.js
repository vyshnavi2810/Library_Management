const jwt= require('jsonwebtoken');
require('dotenv').config()
function verifyToken(req,res,next){
  //get bearer token from headers of req
  const bearerToken=req.headers.authorization
  //if barer token is not available
  if(!bearerToken){
    return res.send({message:"unauthorized access.plz login to continue"})
  }
  //extract token from b earer token
  const token=bearerToken.split(' ')[1]
  try{
    jwt.verify(token,process.env.SECRET_KEY)
    next()
  }
  catch(err){
    next(err)
  }
}
module.exports=verifyToken;