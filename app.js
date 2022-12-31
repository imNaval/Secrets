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
//aoth
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//findOrCreate
const findOrCreate = require('mongoose-findorcreate')

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
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//encryption
//-->see in .env
// userSchema.plugin(encypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  })
});
//////

//////GoogleStrategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // This option tells the strategy to use the userinfo endpoint instead
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",

  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//
app.get("/", function(req, res){
  res.render("home");
});

//google.auth
app.get('/auth/google',
  passport.authenticate('google', {scope: ['profile'] })
)

app.get('/auth/google/secrets',
  passport.authenticate('google', {failurRedirect: '/login'}),
  function(req, res){
    res.redirect('/secrets');
  }
)

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
