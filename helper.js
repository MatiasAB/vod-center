//helper.js

const help = {

	itemCheck: function(...param) {
		for (let i = 0; i < param.length; i++) {
			if (param[i] === undefined || param[i] === "") {
				return false;
			}
		}

		return  true;
	}


};

module.exports = help;