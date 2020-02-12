const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
  name:String,
  post:String,
  gender:String,
  mobile:Number,
  dob:Date,
  createdAt:Date,
  comment:[Object],
  commentofcomment:Object
});

module.exports=userSchema;
