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

	if (req.body.login !== undefined) {
		User.find({username: req.body.username, password:req.body.password}, function(err, varToStoreResult, count) {
			if (varToStoreResult.length < 1) {
				console.log("User not found!");
				res.rediect('title');
			} else {
				console.log("User found! Logging in...");
				myUser = varToStoreResult[0];
				res.redirect('title/user');
			}
		});
	} else {
		User.find({username: req.body.username}, function(err, varToStoreResult, count) {
			if (varToStoreResult.length < 1) {
				new User({
					username: req.body.username,
					password: req.body.password,
					lists: []
				}).save(function(err, user, count){
					console.log("New user created!");
					myUser = user;
					res.redirect('/title/user');
				});
			} else {
				console.log("Username taken!");
				res.redirect('title');
			}
		});
	}
	

	
});

app.get('/title', function (req, res) {
	
	res.render('home');

});

app.get('/title/user', function(req, res) {
	User.find({}, function(err, varToStoreResult, count) {
		console.log(varToStoreResult);
	});
		res.render('user', {theUser: myUser});
	//}
});


const port = 3000;
app.listen(port);
console.log(`server started on port ${port}`);

// console.log(myUser.lists === undefined);
	// if (myUser.lists.length < 1) {
	// 	console.log("here");
	// 	// User.updateOne(
	// 	// 	{"username": myUser.username},
	// 		// {$push: {lists: {
	// 	 // 		user: myUser,
	// 	 // 		name: "My First List",
	// 	 // 		items: [
	// 		// 		     { title: "KJH vs Ginger - Melee Singles Top 48: Losers Round 4 - Full Bloom 5", url: "https://www.youtube.com/watch?v=sqejT7uo5eA", game: "Super Smash Bros. Melee", players: ["Ginger", "KJH"], chars: ["Falco", "Fox"]},
	// 		// 		     { name: "ZeRo vs Armada - Singles Bracket: Losers' Round 1 - Smash Ultimate Summit | Wolf vs Inkling", url: "https://www.youtube.com/watch?v=qo2UUed_p24&t=1428s", game: "Super Smash Bros. Ultimate", players: ["ZeRo", "Armada"], chars: ["Wolf", "Inkling"]},
	// 		// 		   ]
	// 	 // 		}}
	// 	 // 	},
	// 	// ).then((obj) => {
	// 	// 	console.log("Updated - " + obj);
	// 	// });

	// 	User.findOne(
	// 		{username: myUser.username}, 
	// 		function(err,obj) { 
	// 			console.log("hullo????????????????????????????????????????????????????");
	// 			if (err) {
	// 				console.log("Error!!!!!!!---------------------");
	// 				console.log(err);
	// 			} else {

	// 				console.log(obj);
	// 				obj.lists.push({
	// 			 		user: myUser,
	// 			 		name: "My First List",
	// 			 		items: [
	// 						     { title: "KJH vs Ginger - Melee Singles Top 48: Losers Round 4 - Full Bloom 5", url: "https://www.youtube.com/watch?v=sqejT7uo5eA", game: "Super Smash Bros. Melee", players: ["Ginger", "KJH"], chars: ["Falco", "Fox"]},
	// 						     { name: "ZeRo vs Armada - Singles Bracket: Losers' Round 1 - Smash Ultimate Summit | Wolf vs Inkling", url: "https://www.youtube.com/watch?v=qo2UUed_p24&t=1428s", game: "Super Smash Bros. Ultimate", players: ["ZeRo", "Armada"], chars: ["Wolf", "Inkling"]},
	// 						   ]
	// 		 		});

	// 				console.log("round 2==============================");
	// 		 		console.log(obj);
	// 	 		}
	// 		},
	// 	);

	// 	console.log(myUser);

	// 	res.render('user', {theUser: myUser});
	// } else {