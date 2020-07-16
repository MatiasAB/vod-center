//script1

function rmvFunction(ele, name) {
	//merge rmv and save functions?
	if (confirm(`Are you sure you want to remove '${name}'?`)) {
		location.href = ele.id;
	}
}

function checkPl(ele, name) {
	if (name.includes("sent")) {
		alert('You cannot manage attachments from sent mail.');
	} else {
		location.href = ele.id;
	}
}

function saveAt(ele, name) {

	if (confirm(`Do you want to save ${name} to your User?`)) {

		if (name.includes("+item")) {
			const lName = prompt(`What list should ${name} be saved to?`);
			location.href = ele.id + "^&" +lName;
		} else {
			location.href = ele.id;
		}
		
	}
	
	
}

function mergeCheck(ele, length) {
	if (length < 1) {
		alert('This list needs at least one item in order to merge with other lists.');
	} else {
		location.href = ele.id;
	}
}

function mergeConf(formID, itemA) {
	const form = document.getElementById(formID);

	let mLists = findAt((x) => {return x.type.toLowerCase() == 'checkbox' && x.checked == true});

	mLists = mLists.split("&&");
	let str = "";

	for (let j = 0; j < mLists.length; j++) {
		if (j == mLists.length-1) {
			str += mLists[j] + "?";
		} else {
			str += mLists[j] + ", ";
		}
		
	}

	if (confirm(`Are you sure you want to merge ${itemA} with the following lists: ${str}`)) {
		form.submit();
	}
}

function show(id, ...xtra) {

	const count = (xtra[3] !== undefined) ? (parseInt(xtra[3])):(1);

	for (let i = 0; i < count; i++) {
		let id2 =  (count > 1) ? (`${id}%${i}`):(id);

		const div = document.getElementById(id2);

		if (div.style.display == "inline" || div.style.display == "") {
			div.style.display = "none";
			if (xtra[0] !== undefined) {
				xtra[0].innerText = (xtra[1] !== undefined) ? (xtra[1]):('Show');
			}
		} else {
			div.style.display = "inline";
			if (xtra[0] !== undefined) {
				xtra[0].innerText = (xtra[2] !== undefined) ? (xtra[2]):("Hide");
			}
		}
	}
	
}

function splitCheck(ele, length) {
	if (length <= 1) {
		alert('This list needs at least two items in order to be split.');
	} else {
		location.href = ele.id;
	}
}

function createField(name, val) {
	const field = document.createElement('input');
	field.name = name;
	field.value = val;
	return field;

}

function makeForm(method, action, keys, vals) {
	const form = document.createElement('form');
	form.method = method;
	form.action = action;

	for (let i = 0; i < keys.length; i++) {
		form.appendChild(createField(keys[i], vals[i]));
	}

	return form;
}

function findAt(testF) {
	let inputs = document.getElementsByTagName('input');
	let msgAttch = "";

	for(let i = 0; i < inputs.length; i++) {
		console.log(inputs[i].value);
		console.log(inputs[i].checked);
		console.log(inputs[i].type.toLowerCase() == 'checkbox');
		if(testF(inputs[i])) {
			console.log("test passed");
			msgAttch += inputs[i].value + "&&";
		}
		console.log("iteration done");
	}
	return msgAttch.substring(0, msgAttch.length - 2);
}

function sendMsg(...reply) {

	if (!reply.includes("form")) {
		let vals = [];

		if (reply.length > 1) {
			vals = reply;
		} else {
			let msgAttch = findAt((x) => {return x.type.toLowerCase() == 'checkbox' && x.checked == true});
			vals = [document.getElementById("msgDest").value, document.getElementById("msgSubj").value, document.getElementById("msgText").value, msgAttch];
		}
		
		const vals2 = vals.slice(0, 3);

		if (vals2.includes("")) {
			let invalStr = "Error(s):\n";

			if (vals[0] == "") {invalStr+="The message must be sent to another user (empty 'To:' field)\n";}

			if (vals[1] == "") {invalStr+="The message needs a subject. (empty 'Subject:' field)\n";}

			if (vals[2] == "" && (vals[3] == "")) {invalStr+="The message needs a subject if there are no attachments. (empty 'Message:' field)\n";}

			alert(invalStr);
			return false;
		} else { 
			if (confirm('Are you sure you want to send this message?')) {
				const keys = ["msgDest", "msgSubj", "msgText", "msgAttch"];
				
				const form = makeForm('post', '/user/inbox/newmsg', keys, vals);
				console.log(vals[3]);

				document.body.appendChild(form);
				form.submit();
			}
		}
	}
	
	
}

function share(...param) {
	let shareArr = [];
	const prompt1 = prompt('Who do you want to send this to? (Required)');
	if (prompt1 !== null && prompt1 !== "") {
		shareArr.push(prompt1);	
		shareArr.push(`Share - ${param[0]}`);
		let prompt3 = prompt('Type a message (Optional)');
		prompt3 = (prompt3 == "" || prompt3 == null) ? (`Share - ${param[0]}`):(prompt3);
		shareArr.push(prompt3);
		shareArr.push(param[0]);

		sendMsg(...shareArr);	
	}
}


function writeR() {
	
	let msgAttch = findAt((x) => {x.type.toLowerCase() == 'checkbox' && x.checked == true});

	const replyF = [document.getElementById("msgDest").innerText, document.getElementById("msgSubj").innerText, document.getElementById("msgText").value, msgAttch];

	sendMsg(...replyF);
}




function exportList(ele, name) {

	let csvFile = `data:text/csv;charset=utf-8,\r\n` + name + `,\r\n`;

	const tbody = document.querySelector('tbody');
	const length = tbody.children.length;
	let rowL = 0;

	for (let i = 0; i < length; i++) {
		const row = tbody.children[i];

		if (i == 0) {
			rowL = row.children.length;
		}

		for (let j = 0; j < rowL; j++) {
			let ele = row.children[j].innerText;

			if (ele.includes(",")) {
				ele = ele.replace(/,/g, "||");
			}

			if (j == (rowL - 1)) {
				csvFile += `${ele}\r\n`;
			} else {
				csvFile += `${ele} ,`;
			}
		}
	}

	const encodedUri = encodeURI(csvFile);
	const link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", `${name}.csv`);

	if (confirm(`Do you want to download ${name}.csv?`)) {
		document.body.appendChild(link);
		link.click();
	}
}

function splitF(ele, id, ...param) {
	let warnMsg = "Are you sure you want to split this list";

	if (ele.name.includes("Char")) {
		warnMsg += " by character";
	} else if (ele.name.includes("Game")) {
		warnMsg += " by game";
	}

	warnMsg += "?";

	const conf = confirm(warnMsg);
	

	if (conf && param.length > 0) {
		const formData = [document.getElementById("sInd").value.trim(), 
		document.getElementById("sN1").value.trim(), document.getElementById("sN2").value.trim()];

		if (formData[0] === "" || formData[0] === undefined) {
			alert('You must specify an index at which to split the list.');
			return false;
		} else {
			formData[0] = parseInt(formData[0]);
			param[0] = parseInt(param[0]);

			if (formData[0] >= param[0] || formData[0] < 0) {
				alert('Please enter a valid index to split the list by. Refer to the indexing of the items used on this page.');
				return false;
			}
		}

		if ((formData[1] === "" || formData[1] === undefined) && (formData[2] === "" || formData[2] === undefined)) {
			alert('You must give a unique name to at least one of the child lists.');
			return false;
		}

		const keys = ["sInd", "sN1", "sN2"];
		const form = makeForm('post', '/user/split/' + id, keys, formData);
		document.body.appendChild(form);
		form.submit();

	} else if (conf && param.length <= 0) {

		const form = makeForm('post', '/user/split/' + id + '/auto', ["splitBy"], [ele.name]);
		document.body.appendChild(form);
		form.submit();
	}
}