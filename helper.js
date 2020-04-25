//helper.js
const mongoose = require('mongoose');
require('./db');
const User = mongoose.model('User');
const List = mongoose.model('List');
const Item = mongoose.model('Item');
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.set('view engine', 'hbs');

const sessionOptions = { 
	secret: 'secret for signing session id', 
	saveUninitialized: false, 
	resave: false 
};
app.use(session(sessionOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const help = {

	itemCheck: function(...param) {
		for (let i = 0; i < param.length; i++) {
			if (param[i] === undefined || param[i] === "") {
				return false;
			}
		}

		return  true;
	},

	arrCheck: function(...param) {
		const rtArr = [];
		for (let i = 0; i < param.length; i++) {
			if (param[i] === undefined || param[i] === "") {
				rtArr[i] = false;
			} else {
				rtArr[i] = true;
			}
		}

		return rtArr;
	},

	makeEdits: function(arr, vod, ...param) {
		if (arr[0]) {
			vod.name = param[0];
		}

		if (arr[1]) {
			vod.url = param[1];
		}

		if (arr[2]) {
			vod.game = param[2];
		}

		if (arr[3]) {
			vod.players = param[3].split(",");
		}

		if (arr[4]) {
			vod.chars = param[4].split(",");
		}
	},

	login: function(req, res) {
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
	},

	makeUser: function(req, res) {
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
	},

	newList: function(req, res) {
		User.find({username:req.session.user.username}, function(err, varToStoreResult, count) {//something was entered, find session User in database
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
	},

	newItem: function(req, res) {
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

						user.save(function(err3, user2, count) {
							req.session.user = user2;
							res.redirect('back');
						});

					});

				});

			}
		});
	},


	editListName: function(req, res) {
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
	},

	removeList: function(req, res) {
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
	},

	removeItem: function(req, res) {
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
	},

	editItem: function(req, res) {
		const checkArr = help.arrCheck(req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars);

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



			const chList = user.lists.find((x) => {
				return x.name === req.params.listname;
			});


			
			const chItem = chList.items.find((y) => {
				return y.name === req.params.vodname;
			});

			//console.log(`before ${chItem}`);


			help.makeEdits(checkArr, chItem, req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars);

			//console.log(`after ${chItem}`);

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
	},

	filterList: function(req, res, ...param) {
		const rtArr = help.arrCheck(...param);

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				// console.log(user);
				// console.log(user.lists[0]);

				const tList = user.lists.find((x) => {
					return x.name === req.params.listname;
				});

				if (rtArr.includes(true)) {

					tList.items = tList.items.filter(item => {

						const tName = (item.name.includes(param[0]) && param[0] !== "") === rtArr[0];
						const tURL = (param[1] === item.url && param[2] !== "") === rtArr[1];
						const tGame = (item.game.includes(param[2]) && param[2] !== "") === rtArr[2];

						let tPlay = true;
						if (rtArr[3]) {
							for (let i = 0; i < pArr.length; i++) {
								if (!item.players.includes(pArr[i])) {
									tPlay = false;
								}
							}
						}
						//(item.players.includes(param[3])) === (rtArr[3]);

						let tChar = true;
						if (rtArr[4]) {
							for (let i = 0; i < cArr.length; i++) {
								if (!item.chars.includes(cArr[i])) {
									tChar = false;
								}
							}
						}
						//(item.chars.includes(param[4])) === (rtArr[4]);


						return (tName && tURL && tGame && tPlay && tChar);
					});
					
					res.render('slist', {list: tList});
				} else {
					res.render('slist', {list: tList});
				}

			}
		});

		
	}


};

module.exports = help;