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


app.post('/user/lists/:listid', function (req, res) {

	help.newItem(req, res);
	
});

app.get('/user/lists/:listid', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadList(req, res);
	}
	
});

app.get('/user/lists/:listid/chars', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadList(req, res, 1);
	}
	
});

app.get('/user/lists/:listid/games', function (req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadList(req, res, 2);
	}
	
});

app.post('/user/edit/:listid', function (req, res) { //route handler for page after using form
	
	help.editListName(req, res);		
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


app.get('/user/split/:listid', function(req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		User.findOne({_id: req.session.user._id}).populate({path: 'lists', populate: {path: 'items'}}).exec(function (err, user) {
			
			const chList = user.lists.find((x) => {
				return x._id == req.params.listid;
			});

			res.render('split', {chList: chList});
		});
	}

});


app.post('/user/split/:listid', function(req, res) {

	help.splitList(req, res);

});


app.post('/user/split/:listid/auto', function(req, res) {

	help.splitAuto(req, res);

});




//Item related route handlers -----------------------------------------------------------
app.get('/user/lists/:listid/remove/:vodid', function(req, res) {

	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.removeItem(req, res);
	}

});

app.post('/user/lists/:listid/edit/:vodid', function (req, res) {

	help.editItem(req, res);	

});

app.get('/user/lists/:listid/edit/:vodid', function (req, res) {

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


app.get('/user/sent/', function(req, res) {
		
		if (req.session.user === undefined) {
			res.redirect('/title');
		} else {
			help.loadInbox(req, res, "", "mail.sent");
		}
});


app.get('/user/inbox/', function(req, res) {
		
		if (req.session.user === undefined) {
			res.redirect('/title');
		} else {
			help.loadInbox(req, res, "", "mail.inbox");
		}
});

app.post('/user/inbox/newmsg', function(req, res) {
		
		help.sendMsg(req, res);
});

app.get('/user/inbox/newmsg', function(req, res) {
		
		if (req.session.user === undefined) {
			res.redirect('/title');
		} else {
			help.newMsg(req, res);
		}
});

app.get('/user/inbox/viewMsg/:num/manage', function(req, res) {
		
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.lM2(req, res);
	}
});

app.get('/user/inbox/viewMsg/:num', function(req, res) {
		
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadMsg(req, res, "mail.inbox");
	}
});

app.get('/user/sent/viewMsg/:num', function(req, res) {
		
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadMsg(req, res, "mail.sent");
	}
});

app.get('/user/inbox/rmvMsg/:num', function(req, res) {
		
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.removeMsg(req, res, "mail.inbox");
	}
});

app.get('/user/sent/rmvMsg/:num', function(req, res) {
		
	if (req.session.user === undefined) {
		
		res.redirect('/title');
	} else {
		help.removeMsg(req, res, "mail.sent");
	}
});

app.get('/user/inbox/markR/:mid', function (req, res) {
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.markR(req, res);
	}
});

app.get('/user/inbox/reply/:num', function (req, res) {
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.loadMsg(req, res, "mail.inbox", "reply");
	}
});

app.get('/user/inbox/viewMsg/:num/manage/save/:op', function(req, res) {
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.saveAH(req, res);
	}
});

app.get('/user/inbox/sortBy/:sort', function(req, res) {
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.mailG(req, res, 'mail.inbox');
	}
});

app.get('/user/sent/sortBy/:sort', function(req, res) {
	if (req.session.user === undefined) {
		res.redirect('/title');
	} else {
		help.mailG(req, res, 'mail.sent');
	}
});

const port = nconf.get('PORT') || 3000;
app.listen(port);
console.log(`server started on port ${port}`);