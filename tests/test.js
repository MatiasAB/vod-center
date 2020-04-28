const chai = require('chai');
const expect = chai.expect;
const help = require('../helper.js');

describe('helper - unit tests for helper functions that do not require request or response objects', function () {

	describe('arrCheck', function() {

		it('calls .map() on an array, arr, to modify all strings with function changeF and check if they pass the test in function testF, replacing all array items that are not strings or do not pass the test items with false', 
			function() {
			let arr = ["STR1", "", " ", " Str2 ", 5];
			const expected = ["str1", false, false, "str2", false];
			arr = help.arrCheck(arr, (x) => {return x.trim().toLowerCase()}, (y) => {return y.length > 0});
			expect(arr).to.deep.equal(expected);
		});
	});

	describe('makeEdits', function() {
		it('checks an array arr to determine if changes should be made to an Item object, vod', function() {
			
			const arr = ["KJH vs Ginger @ Full Bloom 5", false, "Melee", false, false];

			let vod = {
				name: "KJH vs Ginger - Melee Singles Top 48: Losers Round 4 - Full Bloom 5", 
				url: "https://www.youtube.com/watch?v=sqejT7uo5eA", 
				game: "Super Smash Bros. Melee", 
				players: ["Ginger", "KJH"], 
				chars: ["Falco", "Fox"]
			};

			const expected = {
				name: "KJH vs Ginger @ Full Bloom 5", 
				url: "https://www.youtube.com/watch?v=sqejT7uo5eA", 
				game: "Melee", 
				players: ["Ginger", "KJH"], 
				chars: ["Falco", "Fox"]
			};

			vod = help.makeEdits(arr, vod);

			expect(vod).to.deep.equal(expected);

		});
	});

	describe('filterArr', function() {
		const arr1 = ["Falco", "Fox"];

		it('returns true if any element in an array, arr1, is in a second array, arr2', function () {

			
			const fA1 = help.filterArr(arr1, ["Peach", "Young Link", "Fox"]);
			const fA2 = help.filterArr(arr1,["Jigglypuff", "Falco", "Ganondorf"]);

			expect(fA1).to.equal(true);
			expect(fA2).to.equal(true);
		});

		it('returns false if no element in an array, arr1, is in a second array, arr2', function () {


			const fA3 = help.filterArr(arr1, ["Jigglypuff", "Captain Falcon","Ice Climbers"]);

			expect(fA3).to.equal(false);
		});
	});

	describe('bigFilter - filtering Items', function() {
		let query;

		let arr = [{
			name: "KJH vs Ginger @ Full Bloom 5", 
			url: "https://www.youtube.com/watch?v=sqejT7uo5eA", 
			game: "Melee", 
			players: ["Ginger", "KJH"], 
			chars: ["Falco", "Fox"]
		}, {
			name: "Hbox vs Armada @ EVO 2016",
			url: "https://www.youtube.com/watch?v=HeX8SlPzlXI",
			game: "Super Smash Bros. Melee",
			players: ["Hbox", "Armada"],
			chars: ["Jigglypuff", "Fox"]
		}, {
			name: "Armada vs Zero @ Ultimate Summit 1",
			url: "https://www.youtube.com/watch?v=qo2UUed_p24",
			game: "Ultimate",
			players: ["Armada", "Zero"],
			chars: ["Inkling", "Wolf"]
		}, {
			name: "Armada vs PPMD @ Apex 2015, Winners Semis",
			url: "https://www.youtube.com/watch?v=IomXcdAAt7E",
			game: "Smash Melee",
			players: ["PPMD", "Armada"],
			chars: ["Marth", "Falco", "Peach"]
		}, {
			name: "GO1 vs HookGangGod @ Summit of Power, Semifinals",
			url: "https://www.youtube.com/watch?v=zsca4JgVq0c",
			game: "DBFZ",
			players: ["GO1", "HookGangGod"],
			chars: ["Bardock", "Cell", "Vegeta (SSJ)", "Piccolo"]
		}];

		it('filters an array of Items, arr, based on whether the Items contain the appropriate information from a query object, query', function () {
			query = {
				nameQuery:"  ",
				urlQuery:" ",
				gameQuery:"Melee",
				playsQuery:"Armada",
				charsQuery:"Fox"
			};

			const arr2 = help.bigFilter(arr, query);

			expect(arr2.length).to.equal(1);

		});

		it('returns the same array, arr, unchanged if all of the strings in the query object, query are invalid (empty or just whitespace)', function () {
			query = {nameQuery:"  ", urlQuery:" ", gameQuery:"   ", playsQuery:"", charsQuery:""};

			arr = help.bigFilter(arr, query);

			expect(arr.length).to.equal(5);
		});
	});

	describe('bigFilter - filtering Lists', function() {

		let arr;

		it('filters an array of Lists, arr, based on whether the names of Lists include the string from a query object, query', function () {


			arr = help.bigFilter([{name:"TheBest"}, {name:"Ok at this"}, {name:"Hahahaha"}, {name:"The Absolute Worst"}], {listQuery:"The"});

			expect(arr.length).to.equal(2);
		});

		it('returns the same array, arr, unchanged if the string listQuery in the query object, query is invalid (empty or just whitespace)', function () {
			

			arr = help.bigFilter([{name:"TheBest"}, {name:"Ok at this"}, {name:"Hahahaha"}, {name:"The Absolute Worst"}], {listQuery:""});

			expect(arr.length).to.equal(4);
		});
	});
});