const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=require('./models/model');

const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
  extended:true
}));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost:27017/Edgistify', {useNewUrlParser: true,useUnifiedTopology:true});
mongoose.set("userCreateIndex",true);

userSchema.plugin(passportLocalMongoose);

const User=new mongoose.model("User",userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/",(req,res) => {
  res.render('home');
});

app.get("/register",function(req,res){
  res.render("register",{message:""});
});

app.get("/login",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/submit");
    }
  else{
    res.render("login",{message:""});
    }
});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/error",function(req,res){
  res.render("login",{message:"wrong email or password"});
});
    
app.get("/contact",function(req,res){
  res.render("contact");
});

app.post("/register",function(req,res){
  User.register({username:req.body.username,name:req.body.name,photo:req.body.photo,gender:req.body.gender,dob:req.body.dob,mobile:req.body.mobile},req.body.password,function(err,user){
    if(err){
      res.render("register",{message:"user with same email already exits"});
    }else{
      res.render("login",{message:"account created please log in"});
    }
  });
});


app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local",{ failureRedirect: '/error' })(req,res,function(){
        res.redirect("submit");
      });
    }
  });
});


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    User.findById(req.user.id,function(err,foundUser){
      const name=foundUser.name;
      User.find({post:{$ne:null}},function(err,foundUser){
        if(err){
          console.log(err);
          }else{
            const color=['10316b','a35638','3f4d71','e25822','1b2a49','003f5c','472b62','110133','bd574e','512c62','1f6650','293a80','3d0e1e','007944','0c093c','396362','e47312','a34a28','57007e','5b0909','5d1451','7c0a02','233714','02383c','01024e'];
            res.render("submit",{name:name,userswithposts:foundUser,color:color});
           }
        });
      });
  }else{
    res.redirect("/login");
  }
});


app.post("/submit",function(req,res){
  const postSubmitted=req.body.post;
  const createdAt=new Date();
  //console.log(createdAt.getDate());
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.post=postSubmitted;
        foundUser.createdAt=createdAt;
        foundUser.comment=[];
        foundUser.save(function(){
          res.redirect("/submit");
        });
      }
    }
  });
});

app.get("/delete",function(req,res){
  console.log(req.user.id);
  User.findOneAndDelete({_id:req.user.id},function(err){
    if(err){
      console.log(err);
    }else{
    res.redirect("/");
    }
  });
});

app.get("/deletePost",function(req,res){
  User.findByIdAndUpdate(req.user.id,{post:""},function(err,user){
    res.redirect("submit");
  });
});

app.post("/comment",function(req,res){
  if(req.isAuthenticated()){
    //console.log(req.user);
    User.findById(req.body.postId,function(err,found){
      if(err){
        console.log(err);
      }else{
          const comment={
            name:req.user.name,
            comment:req.body.comment
          }
          found.comment.push(comment);
          found.save();
        }
      res.redirect("/submit");
    });
  }else{
    res.render("login",{message:"login to comment"});
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
