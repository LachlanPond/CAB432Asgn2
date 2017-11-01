function modeArray(array) {
	var modeWord = null;
	var amount = 0;
	for (var i = 0; i < array.length; i++) {
		var count = 0;
		for (var y = 0; y < array.length; y++) {
			if (i == y) {
				continue;
			}
			if (array[i] == array[y]) {
				count++;
			}
		}
		if (count > amount) {
			modeWord = array[i];
		}
	}
	return modeWord;
}

function countArrayElements(array) {
	var a = []; b = []; prev = null;

	array.sort();
	for (var i = 0; i < array.length; i++) {
		if (array[i] !== prev) {
			a.push(array[i]);
			b.push(1);
		}
		else {
			b[b.length-1]++;
		}
		prev = array[i];
	}
	return [a,b];
}

function refSort(target, ref) {
	// Create array of indices
	var zipped = [];

	for (var i = 0; i < ref.length; i++) {
		var zip = {
			"word": target[i],
			"count": ref[i]
		};
		zipped.push(zip);
	}

	zipped.sort(function(a,b) {
		return parseFloat(b.count) - parseFloat(a.count);
	});

	var a = []; b = [];
	for (var i = 0; i < zipped.length; i++) {
		a.push(zipped[i].word);
		b.push(zipped[i].count);
	}

	return [a,b];

	// Sort array of indicies according to the ref data
	// indices.sort(function(a,b) {
	// 	if (ref[a] < ref[b]) {
	// 		return -1;
	// 	}
	// 	else if (ref[a] > ref[b]) {
	// 		return 1;
	// 	}
	// 	return 0;
	// });

	// Map array of indices to corresponding values of the target array
	// return indices.map(function(index) {
	// 	return target[index];
	// });
}