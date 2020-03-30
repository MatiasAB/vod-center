const mongoose = require('mongoose');

//Users
	//have a username and a password which allows access to a list belonging to that user
	//have one list
const User = new mongoose.Schema({
  username: {type:String, required:true}, 
  password: {type:String, required:true},
  list:  { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
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
	//every list that is not the site-wide list should have a User
	//a list can have 0 or more items
const List = new mongoose.Schema({
	user: {type: mongoose.Types.ObjectId, ref: 'User'},
	name: {type: String, required: false},
	items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item'}]
});

//stuff below here