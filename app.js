//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// connect to database
const url = "mongodb://127.0.0.1:27017/userDB";
mongoose.set('strictQuery', false);
mongoose.connect(url);

//schema
userSchema = {
  email: String,
  password: String
}
const User = mongoose.model("User", userSchema);


app.get("/", function(req, res){
  res.render("home");
});


///////register route /////////////
app.route("/register")
  .get(function(req, res){
    res.render("register");
  })
  .post(function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
      })
    newUser.save(function(err){
      if(err){
        console.log(err);
      }else {
        res.render("secrets")
      }
    });
  });

/////////////login route //////////////
app.route("/login")
  .get(function(req, res){
    res.render("login");
  })
  .post(function(req, res){
    email = req.body.username;
    password = req.body.password;

    User.findOne({email: email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else {
        if(foundUser){
          if (foundUser.password === password) {
            res.render("secrets");
          }else {
            res.send("password not match")
          }
        }else {
          res.send("user not found");
        }
      }
    })
  });





app.listen(3000, function(){
  console.log("server started on port 3000");
});
