//jshint esversion:6
// ontop
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 7;
//
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//it must be here
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

// connect to database
const url = "mongodb://127.0.0.1:27017/userDB";
mongoose.set('strictQuery', false);
mongoose.connect(url);

//schema
userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
//encryption
//-->see in .env
// userSchema.plugin(encypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//
app.get("/", function(req, res){
  res.render("home");
});

////secrets
app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
});


///////register route /////////////
app.route("/register")
  .get(function(req, res){
    res.render("register");
  })
  .post(function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        })
      }
    })
  });


/////////////login route //////////////
app.route("/login")
  .get(function(req, res){
    res.render("login");
  })
  .post(function(req, res){

    const user = new User({
      username: req.body.username,
      password: req.body.password
    })

    req.login(user, function(err){
      if(err){
        console.log(err);
      }else {
        passport.authenticate("local")(req,res, function(){
          res.redirect("/secrets");
        })
      }
    })
  });


/////////logout//////////////
app.get("/logout", function(req, res){
  req.logout(function(err){
    if(!err){
      res.redirect("/");
    }
  })
});




//listen
app.listen(3000, function(){
  console.log("server started on port 3000");
});
