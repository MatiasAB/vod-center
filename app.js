// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('./db');
const mongoose = require('mongoose');
let nconf = require('nconf');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = mongoose.model('User');
const List = mongoose.model('List');
const Item = mongoose.model('Item');


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
		User.find({username: req.body.username}, function(err, varToStoreResult, count) {

			if (varToStoreResult.length < 1) {//no match found
				console.log("User not found!");
				res.redirect('back');
			} else {// match found

				//compare hash
				bcrypt.compare(req.body.password, varToStoreResult[0].password, function(err, result) {
					if (result === true) {
						//Log that match was found
						console.log("User found! Logging in...");

						//set current user
						req.session.user = varToStoreResult[0];

						//redirect
						res.redirect('/title/user');
					} else {
						console.log("Incorrect password!");

						res.redirect('back');
					}
				});
				
			}
		});
	} else {//creating an account

		//check if the username is already in use
		User.find({username: req.body.username}, function(err, varToStoreResult, count) {
			if (err) {
				console.log(`err ${err}`);
			}

			if (varToStoreResult.length < 1) {//username not in use, create account
				
				//first hash and salt password
				bcrypt.hash(req.body.password, saltRounds, function(err2, hash) {
					if (err2) {
						console.log(`err2 ${err2}`);
					}
					new User({
						username: req.body.username,
						password: hash,
						lists: []
					}).save(function(err3, user, count){
						if (err3) {
							console.log(`err3 ${err3}`);
						}
						//Log User Creation
						console.log("New user created!");

						//set current user
						req.session.user = user;
						
						//redirect
						res.redirect('/title/user');
					});
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
		User.find({username:req.session.user.username}, function(err, varToStoreResult, count) {//something was entered, find current User in database
			if (varToStoreResult.length < 1) {//check for valid username
				res.redirect('back');
			} else {//found valid user

				const nList = new List({user: req.session.user._id, name: req.body.listname, items:[]})
		        nList.save((err, list) => {
		        
		          if(err) {
		            console.log('error saving nList'); 
		          }
		          //add list to User&#39;s lists
		          varToStoreResult[0].lists.push(nList)

		          //save changes
		          varToStoreResult[0].save(function(err, user, count){
		            req.session.user = user //update current user
		            res.redirect('/title/user'); //redirect to user&#39;s page
		          })
		        
		        });
				
				
			}///////////////////////////////////////////
		});
	}
});

app.get('/title/user/newlist', function (req, res) {
	
	res.render('newlist');

});

app.get('/title/user', function(req, res) {
	console.log("---------------------------------------------");
	console.log("---------------------------------------------");
	console.log("---------------------------------------------");
	console.log("---------------------------------------------");
	//find and print User with User.find()
	User.find({}, function(err, varToStoreResult, count) {
		//log results of find
		console.log(varToStoreResult);
		
		//call findOne
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				//log current user
				// console.log(`my User ${req.session.user}`);
				// console.log(req.session.user.username);
				// console.log(req.session.user.lists);
			 //    //log user found by findOne
			 //    console.log(`user ${user}`);

			    //render user page
			    res.render('user', {theUser: user});
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