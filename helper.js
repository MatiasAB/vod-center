//helper.js
const mongoose = require('mongoose');
require('./db');
const User = mongoose.model('User');
const List = mongoose.model('List');
const Item = mongoose.model('Item');
const Message = mongoose.model('Message');
const ObjectID = mongoose.Types.ObjectId;
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const async = require('async');

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


			const chList = user.lists.splice(chIndex, 1);

			async.each(chList.items, function(chItem, callback2) {
				console.log("yup");
				console.log(chItem);
				Item.deleteOne({_id: chItem._id}, function (err6, result) {
					if (err6) {console.log(err6);}
					console.log("before result");
					console.log(result);
					console.log("after result");
				    callback2();
				});
			}, function (err7) {
				if (err7) {console.log(err7);}

				List.deleteOne({_id: chList._id}, function (err3, result2) {
					if (err3) {
						console.log(err3);
					}
					console.log("before result2");
					console.log(result2);
					console.log("after result2");
					user.save(function(err2, user2, count) {
						req.session.user = user2;
						res.redirect('/user');
					});
				});
			});
		});
	},

	//called from '/user/:listid/remove/:vodid' POST route handler in app.js to remove an item
	removeItem: function(req, res) {
		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {



			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});

			
			const chIndex = chList.items.findIndex((y) => {
				return y._id == req.params.vodid;
			});


			const chItem = chList.items.splice(chIndex, 1);


			const tId = new ObjectID(chItem._id);


			Item.deleteOne({_id: tId}).exec(function (err6, result) {
				if (err6) {console.log(err6);}

				console.log(result);
				chList.save(function(err2, list) {

					if (err2) {
						console.log(err2);
					}

					user.save(function(err3, user2, count) {
						req.session.user = user2;
						res.redirect(`/user/lists/${req.params.listid}`);
					});
				});
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
						res.redirect(`/user/lists/${req.params.listid}`);
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


		for (let j = 0; j < mList.length; j++) {
			for (let k = 0; k < mList[j].items.length; k++) {
				const dupl = chList.items.find((x) => {
					return x._id == mList[j].items[k]._id;
				});

				if (dupl !== undefined) {
					mList[j].items.splice(k, 1);
				}
			}

			if (mList[j].items.length > 0) {
				chList.items = chList.items.concat(mList[j].items);
			}
			
		}


		return chList;

	},

	mergeErr: function(mArr, mList, checkF) {
		let invalStr = "";
		for (let i = 0; i < mArr.length; i++) {
			if (!checkF(mList[i])) {
				invalStr += mArr[i] + ", ";
			}
		}

		return invalStr;
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
					});

					if (x !== undefined) {
						const xInd = user.lists.findIndex((y) => {
							return y._id == x._id;
						});

						user.lists.splice(xInd, 1);
					}

					return x;
				});


				if (mList.includes(undefined)) {
					let invalStr = help.mergeErr(mArr, mList, (x) => {return x !== undefined});

					res.render('merge', {chList: chList, bigList: user.lists, errMsg: "Invalid list name(s) entered: " + invalStr});
				} else {

					mList = help.arrCheck(mList, (x) => {return x}, (y) => {return y.items.length > 0});

					if (mList.includes(false)) {
						let invalStr = help.mergeErr(mArr, mList, (x) => {return x});
						res.render('merge', {chList: chList, bigList:user.lists, errMsg: "The following lists need to have at least one item in order to merge: " + invalStr});
					} else {
						const rtnVal = help.mergeHelp(chList, mList);

						rtnVal.name = req.body.mName;

						rtnVal.save((err2, list) => {
				        
				        	if(err2) {
				            	console.log('error saving nList'); 
				          	}
				        
				        	user.lists.push(rtnVal);


				        	async.each(mList, function(chList, callback) {

				        		async.each(chList.items, function(chItem, callback2) {
				        			Item.deleteOne({_id: chItem._id}, function (err6) {
				        				if (err6) {console.log(err6);}

				        				callback2();
				        			});
				        		}, function (err7) {
				        			if (err7) {console.log(err7);}

				        			List.deleteOne({_id: chList._id}, function (err3) {
										if (err3) {
											console.log(err3);
										}

										callback();
									});
				        		});
							}, function(err4) {
								if (err4) {
									console.log(err4);
								} else {
									user.save(function(err5, user2, count){
								        req.session.user = user2; //update current user
								        res.redirect('/user'); 
							        });
								}
							});
				        });
					}
				}				
			}
		});
	},


	splitList: function(req, res) {
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

				const spInd = (req.body.sInd == 0) ? (1):(req.body.sInd);

				const list2 = new List({
					user: req.session.user._id, 
					name: (req.body.sN2 == "") ? (chList.name):(req.body.sN2), 
					items:[]
				});

				const list1 = new List({
					user: req.session.user._id, 
					name: (req.body.sN1 == "") ? (chList.name):(req.body.sN1), 
					items:[]
				});

				const arrB = chList.items.splice(spInd);

				for (let j = 0; j < arrB.length; j++) {
					list2.items.push(arrB[j]._id);
				}

				for (let k = 0; k < chList.items.length; k++) {
					list1.items.push(chList.items[k]._id);
				}


				async.each(chList.items, function(chItem, callback2) {
				    Item.deleteOne({_id: chItem._id}, function (err6) {
				        if (err6) {console.log(err6);}

				        	callback2();
				        });
				}, function (err7) {
				    if (err7) {console.log(err7);}
				   	List.deleteOne({_id: chList._id}, function (err3) {
						if (err3) {
							console.log(err3);
						}

						list1.save((err9, listA) => {
		        
				        	if(err9) {
				        		console.log('error saving listA'); 
				        	}
					        
					       	user.lists.push(listA);

					          

					       	//save changes
					       	list2.save((err10, listB) => {
				          		if(err10) {
					            	console.log('error saving listB'); 
					          	}
						        
					          	user.lists.push(listB);

					          	user.save(function(err11, user2, count){
						            req.session.user = user2; //update current user
						            res.redirect('/user'); 
					          	});
					    	});
				        });
					});
				});
			}
		});
	},

	splitAuto: function(req, res) {

		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function(err, user) {

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

				const gNum = (req.body.splitBy.includes("Char")) ? (1):(2);

				const bigList = help.groupBy(chList, gNum);

				async.each(bigList.items, function(item, callback) {

					const minList = new List({
						user:req.session.user._id, 
						name:chList.name + " - " + item.name,
						items:[]
					});

					for (let j = 0; j < item.items.length; j++) {
						minList.items.push(item.items[j]._id);
					}

					minList.save(function(err3, svList) {
						if (err3) {
							console.log(err3);
						} else {
							user.lists.push(svList);
							callback();
						}
					});

				}, function(err2) {
					if (err2) {
						console.log(err2);
					} else {
							user.save(function(err4, user2, count){
					            req.session.user = user2; //update current user
					            res.redirect('/user'); 
				          });
					}
				});
			}
		});
	},


	loadInbox: function(req, res, ...conf) {
		User.findOne({_id: req.session.user._id}).populate({path: conf[1]}).exec(function (err, user) {
			res.render(conf[1].substring(5), {tUser: user, mConf: conf[0]});
		});
	},
	

	storeMsg: function(req, res, msg) {
		User.findOne({_id: req.session.user._id}).populate({path: 'mail.sent'}).exec(function(err, user) {

			msg.save(function(err2, msgA) {
				if (err2) {
					console.log(err2);
				} else {
					user.mail.sent.push(msgA);

					user.save(function(err3, user2, count) {
						if (err3) {
							console.log(err3);
						} else {
							req.session.user = user2;
							help.loadInbox(req, res, "Message sent!", "mail.inbox");
						}
					})
				}


			});
		});
	},

	newMsg: function(req, res, ...wMsg) {
		if (wMsg.length > 0) {
			wMsg[1] = "Errors(s): " + wMsg[0]; 
		}
		res.render('newMsg', {wMsg:wMsg[1]});
	},

	sendMsg: function(req, res) {
		User.find({ "username":req.body.msgDest }).populate({path: 'mail.inbox'}).exec(function(err, user) {

			if (user.length < 1) {
				help.newMsg(req, res, "Invalid username entered for destination.");
			} else {
				const uDest = user[0];

				const msg = new Message({
					from: req.session.user.username,
					to: uDest.username,
					subject:req.body.msgSubj,
					content:{text: req.body.msgText, attach:""},
					read:false
				});

				msg.save(function(err2, msgA) {
					if (err2) {
						console.log(err2);
					} else {
						uDest.mail.inbox.unshift(msgA);
						uDest.mail.unread+=1;

						uDest.save(function(err3, user2, count) {
							if (err3) {
								console.log(err3);
							} else {
								help.storeMsg(req, res, msgA);
							}
						});
					}
				});
			}

			
		});
	},

	markR: function(req, res) {
		User.findOne({_id:req.session.user._id}).populate({path: 'mail.inbox'}).exec(function(err, user) {

			const chInd = user.mail.inbox.findIndex((x) => {
				return req.params.mid == x._id;
			});

			user.mail.inbox[chInd].read = true;

			user.mail.inbox[chInd].save(function(err2, msg) {
				if (err2) {
					console.log(err2);
				} else {
					if (user.mail.unread <= 0) {
						user.mail.unread = 0;
					} else {
						user.mail.unread--;
					}

					user.save(function(err3, user2, count) {
						req.session.user = user2;
						help.loadInbox(req, res, "", "mail.inbox");
					});
				}
			});
		});
	},

	loadMsg: function(req, res, ...place) {

		User.find({}).populate({path: place[0]}).exec(function(err, userL) {
			req.session.user = userL.find((x) => {
				return x._id == req.session.user._id;
			});

			const chBox = (place[0].includes("inbox")) ? (req.session.user.mail.inbox):(req.session.user.mail.sent);

			const msg = chBox.find((x) => {
				return x._id == req.params.num;
			});

			if (place[1] == undefined) {
				res.render('viewMsg', {msg:msg, place:place[0].substring(5)}); 
			} else {
				res.render('writeR', {msg:msg});
			}
			

			
		});
	},

	removeMsg: function(req, res, ...place) {

		User.findOne({_id: req.session.user._id}).populate({path: place[0]}).exec(function (err, user) {

			const box = (place[0].includes("inbox")) ? (user.mail.inbox):(user.mail.sent);

			const chMsg = box.find((x) => {
				return x._id == req.params.num;
			});

			
			const chIndex = box.findIndex((y) => {
				return y._id == chMsg._id;
			});


			box.splice(chIndex, 1);

			if (place[0].includes("sent")) {
				Message.deleteOne({_id: chMsg._id}, function (err2) {
					if (err2) {console.log(err2);}

					user.save(function(err3, user2, count) {
						req.session.user = user2;
						res.redirect('/user/sent');
					});
				});

				
			} else {
				user.save(function(err3, user2, count) {
					req.session.user = user2;
					res.redirect('/user/inbox');
				});
			}

			
		});
	}

}

module.exports = help;