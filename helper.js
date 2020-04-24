//helper.js
const mongoose = require('mongoose');
require('./db');
const User = mongoose.model('User');
const List = mongoose.model('List');
const Item = mongoose.model('Item');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const help = {

	itemCheck: function(...param) {
		for (let i = 0; i < param.length; i++) {
			if (param[i] === undefined || param[i] === "") {
				return false;
			}
		}

		return  true;
	},

	editCheck: function(...param) {
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
		if (arr[0] === true) {
			vod.name = param[0];
		}

		if (arr[1] === true) {
			vod.url = param[1];
		}

		if (arr[2] === true) {
			vod.game = param[2];
		}

		if (arr[3] === true) {
			vod.players = param[3];
		}

		if (arr[4] === true) {
			vod.chars = param[4];
		}
	}


};

module.exports = help;