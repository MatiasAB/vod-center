const mongoose = require('mongoose');
var nconf = require('nconf');
nconf.file({ file: 'config.json' })
	.env();

//change

//Users
	//have a username and a password which allows access to a list belonging to that user
	//have one list
const User = new mongoose.Schema({
  username: {type:String, required:true}, 
  password: {type:String, required:true},
  lists:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'List'}],
  mail: {
  	inbox:[{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}], 
  	sent:[{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}],
  	unread: {type: Number, required: true}
  }
});

const Message = new mongoose.Schema({
	from: {type:String, required: true},
	to: {type:String, required: true},
	subject: {type:String, required: true},
	content: {text: {type:String, required: true}, attach: {type:Array, required: false}},
	read: {type: Boolean, required: false}
});


//An Item
	//includes name, url, game, players, characters
const Item = new mongoose.Schema({
	name: {type:String, required: true},
	url: {type:String, required: true},
	game: {type:String, required: true},
	players: {type:Array, required: true},
	chars: {type:Array, required: true}
});


//a VOD list
	//every list should have a User
	//a list can have 0 or more items
const List = new mongoose.Schema({
	user: {type: mongoose.Types.ObjectId, ref: 'User'},
	name: {type: String, required: false},
	items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item'}]
});



if (nconf.get('NODE_ENV') === "PRODUCTION") {
	console.log("PRODUCTION mode");
	dbconf = nconf.get('dbconf');
} else {
	console.log("Not in production");
	dbconf = "mongodb://localhost/final";
}


mongoose.model('User', User);
mongoose.model('List', List);
mongoose.model('Item', Item);
mongoose.model('Message', Message);

mongoose.connect(dbconf, {useUnifiedTopology: true, useNewUrlParser:true});