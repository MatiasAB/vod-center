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

	if (req.body.login !== undefined) {//logging in

		help.login(req, res);
		
	} else {//creating an account

		help.makeUser(req, res);

	}
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


app.post('/user/:listname', function (req, res) {

	if (help.itemCheck(req.body.entryName, req.body.entryURL, req.body.entryGame, req.body.entryPlays, req.body.entryChars) === false) { //checks if name was entered
		res.redirect('back');
	} else {

		help.newItem(req, res);

	}
	
});

app.get('/user/:listname', function (req, res) {

	help.loadList(req, res);
});

app.post('/user/edit/:listname', function (req, res) { //route handler for page after using form
	if (req.body.newName === undefined || req.body.newName === "") { //checks if name was entered
		res.redirect('back');
	} else {
	
		help.editListName(req, res);		

	}
});

app.get('/user/edit/:listname', function (req, res) {

	res.render('editList', {list: req.params.listname});

});



app.get('/user/remove/:listname', function(req, res) {

	help.removeList(req, res);

});




//Item related route handlers -----------------------------------------------------------
app.get('/user/:listname/remove/:vodname', function(req, res) {

	help.removeItem(req, res);

});

app.post('/user/:listname/edit/:vodname', function (req, res) {

	help.editItem(req, res);	

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
		
		help.loadUser(req, res);
});


const port = nconf.get('PORT') || 3000;
app.listen(port);
console.log(`server started on port ${port}`);