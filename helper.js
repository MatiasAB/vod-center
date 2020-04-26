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
			if (param[i] === undefined || param[i].replace(/,/g, "").trim() === "") {
				return false;
			}
		}

		return  true;
	},

	// arrCheck: function(...param) {
	// 	const rtArr = [];
	// 	for (let i = 0; i < param.length; i++) {
	// 		if (param[i] === undefined || param[i].trim() === "") {
	// 			rtArr[i] = false;
	// 		} else {
	// 			rtArr[i] = true;
	// 		}
	// 	}

	// 	return rtArr;
	// },


	arrCheck: function(array) {
		return array.map((cVal) => {
			if (cVal === undefined || cVal.replace(/,/g, "").trim() === "") {
				cVal = false;
			} else {
				cVal = cVal.trim();
			}
			return cVal;
		});
	},

	makeEdits: function(arr, vod) {

		vod.name = (arr[0] !== false) ? (arr[0]):(vod.name);
		vod.url = (arr[1] !== false) ? (arr[1]):(vod.url);
		vod.game = (arr[2] !== false) ? (arr[2]):(vod.game);
		vod.players = (arr[3] !== false) ? (arr[3].split(",")):(vod.players);
		vod.chars = (arr[4] !== false) ? (arr[4].split(",")):(vod.chars);
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
		const checkArr = help.arrCheck([req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars]);

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



			const chList = user.lists.find((x) => {
				return x.name === req.params.listname;
			});


			
			const chItem = chList.items.find((y) => {
				return y.name === req.params.vodname;
			});


			help.makeEdits(checkArr, chItem);

	

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

	bigFilter: function(array, query) {

		let rtArr;

		if (query.urlQuery !== undefined) {
			rtArr = help.arrCheck([query.nameQuery, query.urlQuery, query.gameQuery, query.playsQuery, query.charsQuery]);

				array = array.filter(item => {

					const tName = (rtArr[0] === false) ? (true):(item.name.includes(rtArr[0]));
					//(item.name.includes(param[0])) === rtArr[0];
					const tURL = (rtArr[1] === false) ? (true):(item.url.includes(rtArr[1]));
					const tGame = (rtArr[2] === false) ? (true):(item.game.includes(rtArr[2]));

					let tPlay = true;
					if (rtArr[3] !== false) {
						const pArr = rtArr[3].split(",");
						for (let i = 0; i < pArr.length; i++) {
							if (!item.players.includes(pArr[i])) {
								tPlay = false;
							}
						}
					}

					let tChar = true;
					if (rtArr[4] !== false) {
						const cArr = rtArr[4].split(",");
						for (let i = 0; i < cArr.length; i++) {
							if (!item.chars.includes(cArr[i])) {
								tChar = false;
							}
						}
					}


					return (tName && tURL && tGame && tPlay && tChar);
				});
			

		} else {

			if (query.listQuery.trim() !== "") {

				array = array.filter(list => {
					return list.name.includes(query.listQuery);
				});
			}
		}

		return array;
	},

	loadList: function(req, res) {

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				const tList = user.lists.find((x) => {
					return x.name === req.params.listname;
				});

				if (req.query.nameQuery !== undefined) {

					tList.items = help.bigFilter(tList.items, req.query);
					
				}

				res.render('slist', {list: tList});

			}
		});

		
	},

	loadUser: function(req, res) {
		//call findOne
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				if (req.query.listQuery !== undefined) {
					user.lists = help.bigFilter(user.lists, req.query);
				}
			    res.render('user', {theUser: user});
			}
		});
	}


};

module.exports = help;