//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

// Configure sessions and passport
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// Connect DB
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// Create a schema
const userSchema = new mongoose.Schema ({
    username: {
        type: String,
    },
    password: {
        type: String,
    }
});

// Add passport login to schema
userSchema.plugin(passportLocalMongoose);


// Create a model
const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});


app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/secrets', (req, res)=>{
    if (req.isAuthenticated()){
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.route('/login')
    .get((req, res)=>{
        res.render('login');
    })
    .post(passport.authenticate('local'),
        function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/secrets');
    })

app.route("/register")
    .get( (req, res)=>{
        res.render('register');
    })
    .post((req, res)=>{
        console.log(req.body.username + ' ' + req.body.password);
        User.register({username: req.body.username}, req.body.password, (err,user)=>{
            if(!err){
                req.login(user, function(err) {
                    if (err) { 
                        return next(err); 
                    }
                    return res.redirect('/secrets');
                });

            } else {
                console.log(err);
                res.redirect("/register");
            }
        })
    })

app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
})