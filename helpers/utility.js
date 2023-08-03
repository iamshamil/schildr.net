const fs = require('fs');

exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};

exports.getPermission = (current) => {
	let data = {}, step = {};
	if (current["completed"]) {
		data['Completed'] = true;
	} else if (current["failed"]) {
		data['Failed'] = true;
	} else {
		if (!current["client"]) {
			data['Client'] = true;
			step['STEP 0'] = true;
		}

		if (!current["client1"] && current["shipping2"] && current["clientStatus"] === 0) {
			data['Client'] = true;
			step['STEP 19'] = true;
		}

		if (!current["foreignTrade"] && current["client"]) {
			data['Foreign Trade'] = true;
			step['STEP 1'] = true;
		}

		if (current["financeStatus"] === -1) {
			data['Foreign Trade'] = true;
			step['STEP 17'] = true;
		}

		if (!current["productionPlaning"] && current["foreignTrade"]) {
			data['Production Planning'] = true;
			step['STEP 2'] = true;
		}

		if (!current["productionPlaning1"] && current["technic"]) {
			data['Production Planning'] = true;
			step['STEP 4'] = true;
		}

		if (!current["productionPlaning2"] && current["warehouse1"]) {
			data['Production Planning'] = true;
			step['STEP 14'] = true;
		}

		if (!current["technic"] && current["productionPlaning"] && !current["productionPlaning1"]) {
			data['Technic'] = true;
			step['STEP 3'] = true;
		}
		if (!current["shipping"] && current["productionPlaning1"] && !current["purchasing"]) {
			data['Shipping'] = true;
			step['STEP 5'] = true;
		}
		if (!current["shipping1"] && current["finance"] && !current["quality"]) {
			data['Shipping'] = true;
			step['STEP 10'] = true;
		}
		if (!current["shipping2"] && current["finance1"] && current["quality1"] && !current["client1"]) {
			data['Shipping'] = true;
			step['STEP 18'] = true;
		}

		if (!current["purchasing"] && !current["warehouse"] && current["shipping"]) {
			data['Purchasing'] = true;
			step['STEP 6'] = true;
		}

		if (!current["purchasing1"] && current["warehouse"] && !current["finance"]) {
			data['Purchasing'] = true;
			step['STEP 8'] = true;
		}

		if (!current["finance"] && current["purchasing1"] && !current["shipping1"]) {
			data['Finance'] = true;
			step['STEP 9'] = true;
		}

		if (!current["finance1"] && current["production"] && current["financeStatus"] === 0) {
			data['Finance'] = true;
			step['STEP 16'] = true;
		}

		if (!current["warehouse"] && current["purchasing"] && !current["purchasing1"]) {
			data['Warehouse'] = true;
			step['STEP 7'] = true;
		}

		if (!current["warehouse1"] && current["quality"] && !current["productionPlaning2"]) {
			data['Warehouse'] = true;
			step['STEP 12'] = true;
		}
		if (!current["quality"] && current["shipping1"] && !current["warehouse1"]) {
			data['Quality'] = true;
			step['STEP 11'] = true;
		}

		if (!current["quality1"] && current["production"]) {
			data['Quality'] = true;
			step['STEP 16'] = true;
		}

		if (!current["quality2"] && current["clientStatus"] === -1) {
			data['Quality'] = true;
			step['STEP 20'] = true;
		}

		if (!current["production"] && current["productionPlaning2"]) {
			data['Production'] = true;
			step['STEP 15'] = true;
		}
	}
	return { role: Object.keys(data), step: Object.keys(step) }
}

exports.deleteFile = (link) => {
	try {
		fs.unlinkSync(link);
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}

exports.makeCertficationId = (id) => {
	const sId = String(id);
	const oLen = 10 - sId.length;
	const newId = new Array(oLen).fill(0).join("") + sId;
	return `OA${newId}`;
}