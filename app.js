//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { reduce } = require("async");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

// Connect DB
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true});

// Create a schema
const userSchema = {
    email: {
        type: String,
        required: [true, "You must your email."]
    },
    password: {
        type: String,
        required: [true, "You must set your password"]
    }
};

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
                    if(item.password === req.body.password){
                        res.render('secrets');
                    }
                }
            } else {
                console.log(err);
            }
            res.render('login');
        })
    })

app.route("/register")
    .get( (req, res)=>{
        res.render('register');
    })
    .post((req, res)=>{
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
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
    })

