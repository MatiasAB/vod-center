//app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('./db');
const mongoose = require('mongoose');
const User = mongoose.model('User');


let myUser = {};


app.set('view engine', 'hbs');

const sessionOptions = { 
	secret: 'secret for signing session id', 
	saveUninitialized: false, 
	resave: false 
};
app.use(session(sessionOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {next();});

app.post('/title', (req, res) => {

	//change this later so signing in and creating a user are two separate forms

	User.find({username: req.body.username, password:req.body.password}, function(err, varToStoreResult, count) {
		if (varToStoreResult.length < 1) {
			console.log("User not found! Making a new one...");
			new User({
				username: req.body.username,
				password: req.body.password,
				lists: []
			}).save(function(err, user, count){
				console.log("Saved!");
				myUser = user;
				res.redirect('/title/user');
			});
		} else {
			console.log("User found! Logging in...");
			myUser = varToStoreResult[0];
			res.redirect('title/user');
		}
	});

	
});

app.get('/title', function (req, res) {
	
	res.render('home');

});

app.get('/title/user', function(req, res) {
	User.find({}, function(err, varToStoreResult, count) {
		console.log(varToStoreResult);
	});

	res.render('user', {theUser: myUser});

});


const port = 3000;
app.listen(port);
console.log(`server started on port ${port}`);