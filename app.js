//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate')
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


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
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

// Add passport login to schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Create a model
const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// Serialize and Deserialize
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


//   Google Strategy config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },  
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// Facebook Strategy config
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({facebookId: profile.id}, function(err, user) {
        if (err) { return done(err); }
            done(null, user);
        });
    }
));

app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});


app.get('/', (req, res)=>{
    res.render('home');
});

// Google
app.get('/auth/google', passport.authenticate("google", { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });


// Facebook
app.get('/auth/facebook', passport.authenticate("facebook"));

app.get('/auth/facebook/secrets', passport.authenticate('facebook', { successRedirect: '/secrets', failureRedirect: '/login' }));


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

app.route('/submit')
    .get((req, res)=>{
        if (req.isAuthenticated()){
            res.render('submit');
        } else {
            res.redirect('/login');
        }
    })
    .post((req, res)=>{
        const submittedSecret = req.body.secret;
        console.log(req.user.id);
        User.findById(req.user.id, (err, foundUser)=>{
            if(!err) {
                if (foundUser) {
                    foundUser.secret = submittedSecret;
                    foundUser.save(()=>{
                        res.redirect('/secrets');
                    })
                } else {
                    res.redirect('/login');
                }
            } else {
                console.log(err);
                res.redirect('/login');
            }
        })
    })

