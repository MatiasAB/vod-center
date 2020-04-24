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
const help = require('./helper.js');

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
						res.redirect('/user');
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
						res.redirect('/user');
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

app.post('/user/newlist', function (req, res) { //route handler for page after using form
	if (req.body.listname === undefined || req.body.listname === "") { //checks if name was entered
		res.redirect('back');
	} else {
	
		User.find({username:req.session.user.username}, function(err, varToStoreResult, count) {//something was entered, find current User in database
			if (varToStoreResult.length < 1) {//check for valid username
				res.redirect('back');
			} else {//found valid user

				const nList = new List({user: req.session.user._id, name: req.body.listname, items:[]})
		    	nList.save((err, list) => {
		        
		          if(err) {
		            console.log('error saving nList'); 
		          }
		        
		          varToStoreResult[0].lists.push(nList)

		          //save changes
		          varToStoreResult[0].save(function(err, user, count){
		            req.session.user = user //update current user
		            res.redirect('/user'); 
		          })
		        
		        });
				
				
			}
		});
	}
});

app.get('/user/newlist', function (req, res) {

	res.render('newlist');

});


app.post('/user/:listname', function (req, res) {

	if (help.itemCheck(req.body.entryName, req.body.entryURL, req.body.entryGame, req.body.entryPlays, req.body.entryChars) === false) { //checks if name was entered
		res.redirect('back');
	} else {

		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success
				
				const chList = user.lists.find((x) => {
					return x.name === req.params.listname;
				});

				//console.log(chList);

				const nItem = new Item({
					name: req.body.entryName,
					url: req.body.entryURL,
					game: req.body.entryGame,
					players: req.body.entryPlays.split(","),
					chars: req.body.entryChars.split(",")
				});

				nItem.save((err2, item) => {
					if (err2) {
						console.log("error saving nItem");
					}

					chList.items.push(nItem);

					chList.save(function (err3, list){

						if(err3) {
							console.log('error saving list');
						}

						user.save(function(err, user2, count) {
							req.session.user = user2;
							res.redirect('back');
						});

					});

				});

			}
		});

	}
	
});

app.get('/user/:listname', function (req, res) {
	//console.log(req.params);

	User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				// console.log(user);
				// console.log(user.lists[0]);

				res.render('slist', {list: user.lists.find((x) => {
			     	return x.name === req.params.listname;
			     })});

			}
	});
});

app.post('/user/edit/:listname', function (req, res) { //route handler for page after using form
	if (req.body.newName === undefined || req.body.newName === "") { //checks if name was entered
		res.redirect('back');
	} else {
	
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {

			if (err) {console.log(err);}
			
			const nList = user.lists.find((x) => {
				return x.name === req.params.listname;
			});

			nList.name = req.body.newName;
				
		    nList.save((err2, list) => {
		        
			    if(err2) {
			        console.log('error saving nList for editing name'); 
			    }

			    //save changes
			    user.save(function(err3, user2, count){
			        req.session.user = user2; //update current user
			        res.redirect('/user'); 
			    });


			});
		});		

	}
});

app.get('/user/edit/:listname', function (req, res) {

	res.render('editList', {list: req.params.listname});

});



app.get('/user/remove/:listname', function(req, res) {

	User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {

		const chIndex = user.lists.findIndex((x) => {
			return x.name === req.params.listname;
		});


		user.lists.splice(chIndex, 1);


		user.save(function(err2, user2, count) {
			req.session.user = user2;
			res.redirect('/user');
		})



	});

});

app.get('/user/:listname/remove/:vodname', function(req, res) {

	User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



		const chList = user.lists.find((x) => {
			return x.name === req.params.listname;
		});


		
		const chIndex = chList.items.findIndex((y) => {
			return y.name === req.params.vodname;
		});


		chList.items.splice(chIndex, 1);


		chList.save(function(err2, list) {

			if (err2) {
				console.log(err2);
			}

			user.save(function(err3, user2, count) {
				req.session.user = user2;
				res.redirect(`/user/${req.params.listname}`);
			})

		});



	});

});

app.post('/user/:listname/edit/:vodname', function (req, res) {

	const checkArr = help.editCheck(req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars);

	User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



		const chList = user.lists.find((x) => {
			return x.name === req.params.listname;
		});


		
		const chItem = chList.items.find((y) => {
			return y.name === req.params.vodname;
		});

		console.log(`before ${chItem}`);


		help.makeEdits(checkArr, chItem, req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars);

		console.log(`after ${chItem}`);

		chItem.save((err2, item) => {
					if (err2) {
						console.log("error saving nItem");
					}

					chList.save(function (err3, list){

						if(err3) {
							console.log('error saving list');
						}

						user.save(function(err, user2, count) {
							req.session.user = user2;
							res.redirect(`/user/${req.params.listname}`);
						});

					});

				});

		

	});

	

});

app.get('/user/:listname/edit/:vodname', function (req, res) {

	User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



		const chList = user.lists.find((x) => {
			return x.name === req.params.listname;
		});


		
		const chItem = chList.items.find((y) => {
			return y.name === req.params.vodname;
		});

		res.render('editItem', {vod: chItem, ln: req.params.listname});

	});

	

});

app.get('/user', function(req, res) {

	//find and print User with User.find()
	User.find({}, function(err, varToStoreResult, count) {
		//log results of find
		//console.log(varToStoreResult);
		
		//call findOne
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success
				//console.log(user);
			    res.render('user', {theUser: user});
			}
		});
		
	});

});


const port = nconf.get('PORT') || 3000;
app.listen(port);
console.log(`server started on port ${port}`);