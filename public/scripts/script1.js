//script1

function testFunction(ele) {
	if (confirm('Are you sure you want to remove this?')) {
		location.href = ele.id;
	}
}