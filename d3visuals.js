function drawBarGraph(array, words) {
	var dataArray = array.sort(function(a, b){ return b-a });
	var wordArray = refSort(words, array);
	wordArray = wordArray[0];
	dataArray.length = 30;
	wordArray.length = 30;
	console.log(dataArray);
	console.log(wordArray);
	var width = dataArray.length * 30;
	var height = 500;
	var scaleMax = Math.max.apply(Math, dataArray);

	var heightScale = d3.scale.linear()
					.domain([0, scaleMax])
					.range([0, height]);

	var yScale = d3.scale.linear()
				.range([height, 0]);

	var xScale = d3.scale.linear()
				.range([0, width]);

	var color = d3.scale.linear()
				.domain([0, scaleMax])
				.range(["red", "blue"]);

	var xAxis = d3.svg.axis()
				.ticks(30)
				.tickFormat(function(d, i) { return wordArray[i]; })
				.scale(xScale);

	var canvas = d3.select("body")
				.append("svg")
					.attr("width", width)
					.attr("height", height + 100);

	var bars = canvas.selectAll("rect")
				.data(dataArray)
				.enter()
					.append("rect")
					.attr("width", 30)
					.attr("height", function(d) { return heightScale(d); })
					.attr("fill", function(d) { return color(d) })
					.attr("x", function(d, i) { return i * 30 })
					.attr("y", function(d) { return height - heightScale(d); })

	canvas.append("g")
		.attr("transform", "translate(0, 500)")
		.call(xAxis)
		.selectAll('text')
		.attr("transform", "rotate(-60)")
		//.style("font-size", "12px")
		
		.style("text-anchor", "end");
}