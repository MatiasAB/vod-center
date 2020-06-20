//script1

function testFunction(ele, name) {
	if (confirm(`Are you sure you want to remove '${name}'?`)) {
		location.href = ele.id;
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

function exportList(ele, name, length) {
	length = parseInt(length);

	let csvFile = `data:text/csv;charset=utf-8,\r\n` + name + `,\r\n`;

	for (let i = 0; i < length; i++) {
		const row = document.getElementById(i.toString());
		csvFile += row.children[0].innerText + ",\r\n" + row.children[1].innerText + ",\r\n" +
		row.children[2].innerText + ",\r\n" + row.children[3].innerText + "\r\n" +
		row.children[4].innerText + "\r\n"; 
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

		const form = document.createElement('form');
		form.method = 'post';
		form.action = '/user/split/' + id;

		form.appendChild(createField("sInd", formData[0]));
		form.appendChild(createField("sN1", formData[1]));
		form.appendChild(createField("sN2", formData[2]));

		document.body.appendChild(form);
		form.submit();
	} else if (conf && param.length <= 0) {
		const form = document.createElement('form');
		form.method = 'post';
		form.action = '/user/split/' + id + '/auto';

		form.appendChild(createField("splitBy", ele.name));
		document.body.appendChild(form);
		form.submit();
	}
}