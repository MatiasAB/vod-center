//script1

function testFunction(ele) {
	if (confirm('Are you sure you want to remove this?')) {
		location.href = ele.id;
	}
}

function createField(name, val) {
	const field = document.createElement('input');
	field.name = name;
	field.value = val;
	return field;

}

function splitF(ele, id, ...param) {
	console.log(ele.name);
	console.log(id);
	let warnMsg = "Are you sure you want to split this list ";

	if (ele.name.includes("Char")) {
		warnMsg += "by character";
	} else if (ele.name.includes("Game")) {
		warnMsg += "by game";
	}

	warnMsg += "?";

	const conf = confirm(warnMsg);

	

	if (conf && param !== undefined) {
		console.log(param);
		console.log(document.getElementById("sInd").value);
		const formData = [document.getElementById("sInd").value.trim(), 
		document.getElementById("sN1").value.trim(), document.getElementById("sN2").value.trim()];

		if (formData[0] === "" || formData[0] === undefined) {
			alert('You must specify an index at which to split the list.');
			return false;
		} else {
			formData[0] = parseInt(formData[0])-1;
			param[0] = parseInt(param[0]);

			if (formData[0] >= param[0]) {
				alert('Please enter a valid index to split the list by.');
				return false;
			}
		}

		console.log("print tests");
		console.log(formData[1]);
		console.log(formData[2]);

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
	}
}