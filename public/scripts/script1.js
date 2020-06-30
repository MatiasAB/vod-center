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
		location.href = ele.id;
	}
}

function mergeCheck(ele, length) {
	if (length < 1) {
		alert('This list needs at least one item in order to merge with other lists.');
	} else {
		location.href = ele.id;
	}
}

function show(id) {
	const div = document.getElementById(id);

	if (div.style.display == "inline") {
		div.style.display = "none";
	} else {
		div.style.display = "inline";
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

function share(...param) {
	let shareArr = [];
	const prompt1 = prompt('Who do you want to send this to? (Required)');
	if (prompt1 !== null || prompt1 !== "") {
		shareArr.push(prompt1);
		let prompt2 = prompt('What should the subject of the message be? (Optional)');
		prompt2 = (prompt2 == "" || prompt2 == null) ? (`Share - ${param[1]}`):(prompt2);	
		shareArr.push(prompt2);
		let prompt3 = prompt('What should the message read? (Optional)');
		prompt3 = (prompt3 == null) ? (""):(prompt3);
		shareArr.push(prompt3);
		shareArr.push(param[1]);

		sendMsg(...shareArr);	
	}
}


function writeR() {

	const replyF = [document.getElementById("msgDest").innerText, document.getElementById("msgSubj").innerText, document.getElementById("msgText").value, document.getElementById("msgAttch").value];

	sendMsg(...replyF);
}

function sendMsg(...reply) {

	let vals = [];

	if (reply.length > 0) {
		vals = reply;
	} else {
		vals = [document.getElementById("msgDest").value, document.getElementById("msgSubj").value, document.getElementById("msgText").value, document.getElementById("msgAttch").value];
	}
	
	

	if (vals.includes("")) {
		let invalStr = "Error(s):\n";

		if (vals[0] == "") {invalStr+="The message must be sent to another user (empty 'To:' field)\n";}

		if (vals[1] == "") {invalStr+="The message needs a subject. (empty 'Subject:' field)\n";}

		if (vals[2] == "" && atVal == "") {invalStr+="The message needs a subject if there are no attachments. (empty 'Message:' field)\n";}

		alert(invalStr);
	} else {
		if (confirm('Are you sure you want to send this message?')) {
			const keys = ["msgDest", "msgSubj", "msgText", "msgAttch"];

			console.log(vals);

			const form = makeForm('post', '/user/inbox/newmsg', keys, vals);

			document.body.appendChild(form);
			form.submit();
		}
	}
	
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
			formData[0] = parseInt(formData[0])-1;
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