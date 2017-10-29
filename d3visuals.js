function drawBarGraph(array, words) {
	var dataArray = array.sort(function(a, b){ return b-a });
	var wordArray = refSort(words, array);
	wordArray = wordArray[0];
	dataArray.length = 30;
	wordArray.length = 30;

	var width = dataArray.length * 30;
	var height = 500;

		var body = d3.select("body")
					.append("svg")
						.attr("width", width)
						.attr("height", height);
		var svg = d3.select("svg"),
	    margin = {top: 20, right: 20, bottom: 100, left: 40},
	    width = +svg.attr("width") - margin.left - margin.right,
	    height = +svg.attr("height") - margin.top - margin.bottom;

	var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
	    y = d3.scaleLinear().rangeRound([height, 0]),
	    color = d3.scaleLinear().range(["red", "blue"]);

	var g = svg.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.tsv("data.tsv", function(d) {
	  d.count = +d.count;
	  return d;
	}, function(error, data) {d3 
	  if (error) throw error;

	  x.domain(data.map(function(d) { return d.word; }));
	  y.domain([0, d3.max(data, function(d) { return d.count; })]);
	  color.domain([0, d3.max(data, function(d) { return d.count; })]);

	  g.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + height + ")")
	      .call(d3.axisBottom(x))
	      .selectAll('text')
	      	.attr("transform", "rotate(-60)")
	      	.style("text-anchor", "end");

	  g.append("g")
	      .attr("class", "axis axis--y")
	      .call(d3.axisLeft(y).ticks(10))
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .attr("text-anchor", "end")
	      .text("Frequency");

	  g.selectAll(".bar")
	    .data(data)
	    .enter().append("rect")
	      .attr("class", "bar")
	      .attr("fill", function(d) { return color(d.count); })
	      .attr("x", function(d) { return x(d.word); })
	      .attr("y", function(d) { return y(d.count); })
	      .attr("width", x.bandwidth())
	      .attr("height", function(d) { return height - y(d.count); });
	});

}