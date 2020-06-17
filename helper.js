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


//module for helper functions for app.js. 
const help = {

	//calls .map() on an array, arr, to modify all strings with function changeF and check if they pass the test in function testF, 
	//replacing all array items that are not strings or do not pass the test items with false
	arrCheck: function(array, changeF, testF) {
		return array.map((cVal) => {
			//cVal.replace(/,/g, "").trim() === ""
			if (typeof cVal == "string") {
				cVal = changeF(cVal);
				return (testF(cVal)) ? (cVal):(false);
			} else {
				return false;
			}
			return cVal;
		});
	},

	//checks an array arr to determine if changes should be made to an Item object, vod
	makeEdits: function(arr, vod) {

		vod.name = (arr[0] !== false) ? (arr[0]):(vod.name);
		vod.url = (arr[1] !== false) ? (arr[1]):(vod.url);
		vod.game = (arr[2] !== false) ? (arr[2]):(vod.game);
		vod.players = (arr[3] !== false) ? (arr[3].split(",").map((x) => { return x.trim(); })):(vod.players);
		vod.chars = (arr[4] !== false) ? (arr[4].split(",").map((x) => { return x.trim(); })):(vod.chars);

		return vod;
	},

	//called from setUser if the visitor is signing into an exisiting account.
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

	//called from setUser if the visitor is creating a new account.
	makeUser: function(req, res) {

			User.find({username: req.body.username}, function(err, varToStoreResult, count) {
				if (err) {
					console.log(`err creating User ${err}`);
				}

				if (varToStoreResult.length < 1) {//username not in use, create account
					
					//first hash and salt password
					bcrypt.hash(req.body.password, saltRounds, function(err2, hash) {
						if (err2) {
							console.log(`err2 hashing password for new User ${err2}`);
						}
						new User({
							username: req.body.username,
							password: hash,
							lists: []
						}).save(function(err3, user, count){
							if (err3) {
								console.log(`err3 saving User after creation ${err3}`);
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

	//called from '/title' route handler in app.js to set session's user
	setUser: function(req, res) {

		const validVar = help.arrCheck([req.body.username, req.body.password], (x) => {return x.trim()}, (y) => {return (y.length > 0)});

		if (validVar) {

			if (req.body.login === undefined) {
				help.makeUser(req, res);
			} else {
				help.login(req, res);
			}
			
		} else {
			console.log("Invalid credentials entered.");
			res.redirect('back');
		}
	},

	//called from '/user' POST route handler in app.js to create a new list
	newList: function(req, res) {
		User.find({_id:req.session.user._id}, function(err, varToStoreResult, count) {//something was entered, find session User in database
			if (varToStoreResult.length < 1) {//check for valid username
				res.redirect('back');
			} else {//found valid user

				const nList = new List({user: req.session.user._id, name: req.body.listname, items:[]})
		    	nList.save((err, list) => {
		        
		          if(err) {
		            console.log('error saving nList'); 
		          }
		        
		          varToStoreResult[0].lists.push(nList);

		          

		          //save changes
		          varToStoreResult[0].save(function(err, user, count){
		            req.session.user = user //update current user
		            res.redirect('/user'); 
		          })
		        
		        });
				
				
			}
		});
	},

	//called from '/user/:listid' POST route handler in app.js to create a new item
	newItem: function(req, res) {
		const chArr = help.arrCheck([req.body.entryName, req.body.entryURL, req.body.entryGame, req.body.entryPlays, req.body.entryChars], 
			(x) => {return x.trim()}, (y) => {return (y.replace(/,/g, "").length > 0)});

		if (chArr.includes(false)) { //checks if name was entered
			res.redirect('back');
		} else {
			User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
				
				if (err) { // error check
					console.log(err);
					res.redirect('/title');
				} else { //success
					
					const chList = user.lists.find((x) => {
						return x._id == req.params.listid;
					});

					
					const plArr = req.body.entryPlays.split(",").map((x) => {
						return x.trim();
					});	

					const chArr = req.body.entryChars.split(",").map((x) => {
						return x.trim();
					});						

					const nItem = new Item({
						name: req.body.entryName,
						url: req.body.entryURL,
						game: req.body.entryGame,
						players: plArr,
						chars: chArr
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
		}
			
	},

	//called from '/user/edit/:listid' POST route handler in app.js to edit the name of a list
	editListName: function(req, res) {
		const validVar = help.arrCheck([req.body.newName], (x) => {return x.trim()}, (y) => {return (y.length > 0)});

		if (validVar) {
			User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {

				if (err) {console.log(err);}
				
				const nList = user.lists.find((x) => {
					return x._id == req.params.listid;
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
		} else {
			console.log("Invalid name entered");
			res.redirect('back');
		}
	},

	//called from '/user/remove/:listid' POST route handler in app.js to remove a list
	removeList: function(req, res) {
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {

			const chIndex = user.lists.findIndex((x) => {
				return x._id == req.params.listid;
			});


			user.lists.splice(chIndex, 1);


			user.save(function(err2, user2, count) {
				req.session.user = user2;
				res.redirect('/user');
			})



		});
	},

	//called from '/user/:listid/remove/:vodid' POST route handler in app.js to remove an item
	removeItem: function(req, res) {
		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});


			
			const chIndex = chList.items.findIndex((y) => {
				return y._id == req.params._id;
			});


			chList.items.splice(chIndex, 1);


			chList.save(function(err2, list) {

				if (err2) {
					console.log(err2);
				}

				user.save(function(err3, user2, count) {
					req.session.user = user2;
					res.redirect(`/user/${req.params.listid}`);
				})

			});



		});
	},

	//called from '/user/:listid/edit/:vodid' POST route handler in app.js to edit an item
	editItem: function(req, res) {
		const checkArr = help.arrCheck([req.body.newName, req.body.newURL, req.body.newGame, req.body.newPlays, req.body.newChars], 
			(x) => {return x.trim()}, (y) => {return (y.replace(/,/g, "").length > 0)});

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});


			
			let chItem = chList.items.find((y) => {
				return y._id == req.params.vodid;
			});


			chItem = help.makeEdits(checkArr, chItem);

	

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
						res.redirect(`/user/${req.params.listid}`);
					});

				});

			});
		});
	},

	//returns true if any element in an array, arr1, is in a second array, arr2. 
	filterArr: function(arr1, arr2) {
		for (let i = 0; i < arr1.length; i++) {
			if (arr2.includes(arr1[i].trim())) {
				return true;
			}
		}

		return false;
	},

	//filters an array, arr, based on whether the array entries contain the appropriate information from a query object, query
	//only works with an array of lists or an array of items
	bigFilter: function(array, query) {

		let rtArr;

		if (query.urlQuery !== undefined) {
			rtArr = help.arrCheck([query.nameQuery, query.urlQuery, query.gameQuery, query.playsQuery, query.charsQuery],
				(x) => {return x.toLowerCase().trim()}, (y) => {return (y.replace(/,/g, "").length > 0)});

				array = array.filter(item => {

					const tName = (rtArr[0] === false) ? (true):(item.name.toLowerCase().includes(rtArr[0]));
					const tURL = (rtArr[1] === false) ? (true):(item.url.toLowerCase().includes(rtArr[1]));
					const tGame = (rtArr[2] === false) ? (true):(item.game.toLowerCase().includes(rtArr[2]));

					let tPlay = true;
					if (rtArr[3] !== false) {

						tPlay = help.filterArr(rtArr[3].split(","), item.players.map(x => {
							return x.toLowerCase();
						}));
					}

					let tChar = true;
					if (rtArr[4] !== false) {

						tChar = help.filterArr(rtArr[4].split(","), item.chars.map(x => {
							return x.toLowerCase();
						}));

					}


					return (tName && tURL && tGame && tPlay && tChar);
				});
			

		} else {

			if (query.listQuery.trim() !== "") {

				array = array.filter(list => {
					return list.name.toLowerCase().includes(query.listQuery.toLowerCase().trim());
				});
			}
		}

		return array;
	},


	groupInc: function(listA, str, num) {
		for (let i=0; i < listA.length; i++) {
			if (listA[i].name === str) {
				return listA[i];
			}
		}

		return undefined;
		
	},


	groupBy: function(list, num) {
		const str = (num === 1) ? (" grouped by characters"):(" grouped by games");
		let bigArr = {name: list.name + str, items:[], _id: list._id};

		if (num === 2) {
			list.items.map((x) => {
				if (help.groupInc(bigArr.items, x.game, num) === undefined) {
					bigArr.items.push({name:x.game, items:[x]});
				} else {
					const pList = bigArr.items.find((y) => {return y.name === x.game});
					pList.items.push(x);
				}
			});
		} else {
			list.items.map((x) => {
				x.chars.map((y) => {
					if (help.groupInc(bigArr.items, y, num) === undefined) {
						bigArr.items.push({name:y, items:[x]});
					} else {
						const pList = bigArr.items.find((z) => {return z.name === y});
						pList.items.push(x);
					}
				});
			});
		}
		
		
		

		return bigArr;
	},

	//called from the '/user/:listid' GET route handler to load a list and its contents.
	loadList: function(req, res, ...num) {

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				let tList = user.lists.find((x) => {
					return x._id == req.params.listid;
				});

				if (req.query.nameQuery !== undefined) {
					tList.items = help.bigFilter(tList.items, req.query);	
				}

				if (num[0] === undefined) {
					res.render('slist', {list: tList});
				} else {
					tList = help.groupBy(tList, num[0]);

					if (num[0] === 2) {
						res.render('gsList', {list: tList});
					} else {
						res.render('csList', {list: tList});
					}
				}

				

			}
		});

		
	},

	//called from the '/user' GET route handler to load a user and its contents.
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
	},



	mergeHelp: function(chList, mList) {

		// console.log("testing something");
		// console.log(mList[0]);

		for (let j = 0; j < mList.length; j++) {
			// console.log("mergeHelp Loop");
			// console.log(mList[j]);
			// console.log(mList[j].items);
			chList.items = chList.items.concat(mList[j].items);
		}

		//console.log("after mergeHelp");

		return chList;

	},



	mergeLists: function(req, res) {

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {

			if (err) {
				console.log(err);
				res.redirct('/title');
			} else {

				const chList = user.lists.find((x) => {
					return x._id == req.params.listid;
				});

				const chIndex = user.lists.findIndex((x) => {
					return x._id == chList._id;
				});

				user.lists.splice(chIndex, 1);

				const mArr = req.body.mLists.trim().split(",");

				mList = mArr.map((x)  => {
			
					x = user.lists.find((z) => {
						return z.name.trim() == x;
					});;

					//console.log(x);

					const xInd = user.lists.findIndex((y) => {
						return y._id == x._id;
					});

					user.lists.splice(xInd, 1);

					return x;
				});

				const rtnVal = help.mergeHelp(chList, mList);

				// console.log("printing rtnVal");
				// console.log(rtnVal);

				rtnVal.name = req.body.mName;

				rtnVal.save((err, list) => {
		        
		          if(err) {
		            console.log('error saving nList'); 
		          }
		        
		          user.lists.push(rtnVal);

		          

		          //save changes
		          user.save(function(err, user2, count){
		            req.session.user = user2; //update current user
		            res.redirect('/user'); 
		          });
		        
		        });

			}
		});
	}


};

module.exports = help;