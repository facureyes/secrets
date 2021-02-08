//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');


const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

// Security
const saltRounds = 10;


// Connect DB
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true});

// Create a schema
const userSchema = new mongoose.Schema ({
    email: {
        type: String,
        required: [true, "You must your email."]
    },
    password: {
        type: String,
        required: [true, "You must set your password"]
    }
});


// Create a model
const User = mongoose.model("User", userSchema);


app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});


app.get('/', (req, res)=>{
    res.render('home');
});

app.route('/login')
    .get((req, res)=>{
        res.render('login');
    })
    .post((req,res)=>{
        User.findOne({email:req.body.username}, (err, item)=>{
            if(!err){
                if(item){
                    bcrypt.compare(req.body.password, item.password, function(err, result) {
                        if(result){
                            res.render('secrets');
                        }
                        else {
                            res.render('login');
                        }
                    });
                    
                }
            } else {
                console.log(err);
                res.render('login');
            }
            
        })
    })

app.route("/register")
    .get( (req, res)=>{
        res.render('register');
    })
    .post((req, res)=>{
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            // Store hash in your password DB.
            const newUser = new User({
                email: req.body.username,
                password: hash
            });
            newUser.save((err)=>{
                if(!err){
                    console.log("Succesfully register.");
                    res.render('secrets');
                } else {
                    console.log(err);
                    res.render("register");
                }
            })
        });
    })

app.get('/logout', (req, res)=>{
    res.redirect('/');
})