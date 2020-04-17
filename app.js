// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('./db');
const mongoose = require('mongoose');
let nconf = require('nconf');
const User = mongoose.model('User');
const List = mongoose.model('List');
const Item = mongoose.model('Item');

let myUser = {};

nconf.env();

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

	if (req.body.login !== undefined) {//logging in

		//find a username + password match
		User.find({username: req.body.username, password:req.body.password}, function(err, varToStoreResult, count) {

			if (varToStoreResult.length < 1) {//no match found
				console.log("User not found!");
				res.redirect('back');
			} else {// match found

				//Log that match was found
				console.log("User found! Logging in...");

				//set current user
				myUser = varToStoreResult[0];

				//redirect
				res.redirect('/title/user');
			}
		});
	} else {//creating an account

		//check if the username is already in use
		User.find({username: req.body.username}, function(err, varToStoreResult, count) {

			if (varToStoreResult.length < 1) {//username not in use, create account
				new User({
					username: req.body.username,
					password: req.body.password,
					lists: []
				}).save(function(err, user, count){

					//Log User Creation
					console.log("New user created!");

					//set current user
					myUser = user;
					
					//redirect
					res.redirect('/title/user');
				});
			} else {//username taken
				console.log("Username taken!");

				//refresh
				res.redirect('back');
			}
		});
	}
	

	
});

app.get('/title', function (req, res) {
	
	res.render('home');

});

app.get('/', function (req, res) {
	
	res.redirect('title');

});

app.post('/title/user/newlist', function (req, res) { //route handler for page after using form
	if (req.body.listname === undefined || req.body.listname === "") { //checks if name was entered
		res.redirect('back');
	} else {
		//console.log(`username before list add ${myUser.username}`);
		User.find({username:myUser.username}, function(err, varToStoreResult, count) {//something was entered, find current User in database
			if (varToStoreResult.length < 1) {//check for valid username
				res.redirect('back');
			} else {//found valid user

				//make list to be inserted
				const nList = new List({user: myUser._id, name: req.body.listname, items:[]});


				//add list to User's lists
				varToStoreResult[0].lists.push(nList);
				

				//save changes
				varToStoreResult[0].save(function(err, user, count){
					myUser = user; //update current user
					res.redirect('/title/user'); //redirect to user's page
				});
				
			}
		});
	}
});

app.get('/title/user/newlist', function (req, res) {
	
	res.render('newlist');

});

app.get('/title/user', function(req, res) {

	//req.user check?
	console.log(req.user);
	console.log(req.body.user);

	//find and print User with User.find()
	User.find({}, function(err, varToStoreResult, count) {
		//log results of find
		//console.log(varToStoreResult);
		
		//call findOne
		User.findOne({_id: myUser._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				//log current user
				console.log(`myUser ${myUser}`);
				console.log(`req.user ${req.user}`);
			    //log user found by findOne
			    console.log(`user ${user}`);

			    //render user page
			    res.render('user', {theUser: myUser});
			}
		});
		
	});

});

	//console.log(`username ${myUser.username}`);
	//find and print User with findOne() and populate()


		//check that usernames match 
	  	//console.log(`The usernames match: ${user.username === myUser.username}`);

	  	//check that passwords match
	  	//console.log(`The passwords match: ${user.password === myUser.password}`);

	  	//check that ids match
	  	//console.log(`The ids match: ${user._id === myUser._id}`);
	  	//print ids
	  	//console.log(myUser._id);
	  	//console.log(user._id);
	    
	  	//check that lists of lists match
	    //console.log(`The lists match: ${user.lists === myUser.lists}`);
	    //print lists of lists
	    //console.log(myUser.lists);
	    //console.log(user.lists);

	    //update current User, render page
	    
	  
		
	//}
const port = nconf.get('PORT') || 3000;
app.listen(port);
console.log(`server started on port ${port}`);