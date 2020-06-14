// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('./db');
const mongoose = require('mongoose');
let nconf = require('nconf');
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



//General Route handlers -----------------------------------------------------------
app.use((req, res, next) => {next();});

app.post('/title', (req, res) => {

	help.setUser(req, res);
});

app.get('/title', function (req, res) {
	
	res.render('home');

});

app.get('/', function (req, res) {
	
	res.redirect('title');

});




//List related route handlers -----------------------------------------------------------
app.post('/user', function (req, res) { //route handler for page after using form
	if (req.body.listname === undefined || req.body.listname === "") { //checks if name was entered
		res.redirect('back');
	} else {
		help.newList(req, res);
	}
});


app.post('/user/:listid', function (req, res) {

	help.newItem(req, res);
	
});

app.get('/user/:listid', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadList(req, res);
	}
	
});

app.post('/user/edit/:listid', function (req, res) { //route handler for page after using form
	if (req.body.newName === undefined || req.body.newName === "") { //checks if name was entered
		res.redirect('back');
	} else {
	
		help.editListName(req, res);		

	}
});

app.get('/user/edit/:listid', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			if (err) { // error check
				console.log(err);
				res.redirect('/title');
			} else { //success

				const tList = user.lists.find((x) => {
					return x._id == req.params.listid;
				})
				
			    res.render('editList', {list: tList});
			}
		});
	}

});



app.get('/user/remove/:listid', function(req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.removeList(req, res);
	}

});



app.get('/user/merge/:listid', function(req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		User.findOne({_id: req.session.user._id}).populate('lists').exec(function (err, user) {
			
			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});

			const bigList = user.lists;

			const chIndex = user.lists.findIndex((x) => {
				return x._id == chList._id;
			});

			bigList.splice(chIndex, 1);

			res.render('merge', {chList: chList, bigList: bigList});
		});
	}

});



app.post('/user/merge/:listid', function(req, res) {

	help.mergeLists(req, res);

});




//Item related route handlers -----------------------------------------------------------
app.get('/user/:listid/remove/:vodid', function(req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.removeItem(req, res);
	}

});

app.post('/user/:listid/edit/:vodid', function (req, res) {

	help.editItem(req, res);	

});

app.get('/user/:listid/edit/:vodid', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});


			
			const chItem = chList.items.find((y) => {
				return y._id == req.params.vodid;
			});

			res.render('editItem', {vod: chItem, ln: req.params.listid});

		});
	}
});

app.get('/user', function(req, res) {
		
		if (req.session.user === undefined) {
			res.redirect('/title');
		} else {
			help.loadUser(req, res);
		}
});


const port = nconf.get('PORT') || 3000;
app.listen(port);
console.log(`server started on port ${port}`);