function drawBarGraph(array, words) {
	var dataArray = array.sort(function(a, b){ return b-a });
	var wordArray = refSort(words, array);
	wordArray = wordArray[0];
	dataArray.length = 30;
	wordArray.length = 30;

	var width = dataArray.length * 30;
	var height = 500;

		var body = d3.select("#barchart")
					.append("svg")
						.attr("width", width)
						.attr("height", height)
						.attr("class", "bar");
		var svg = d3.select(".bar"),
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

function drawPieChart() {
	var piechart = d3.select("#piechart")
					.append("svg")
					.attr("width", 960)
					.attr("height", 500)
					.attr("class", "pie");

	var svg = d3.select(".pie"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = Math.min(width, height) / 2,
    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#7b6000"]);

	var pie = d3.pie()
	    .sort(null)
	    .value(function(d) { return d.value; });

	var path = d3.arc()
	    .outerRadius(radius - 10)
	    .innerRadius(0);

	var label = d3.arc()
	    .outerRadius(radius - 40)
	    .innerRadius(radius - 40);

	d3.csv("piedata.tsv", function(d) {
	  d.count = +d.count;
	  return d;
	}, function(error, data) {
	  if (error) throw error;

	  var arc = g.selectAll(".arc")
	    .data(pie(data))
	    .enter().append("g")
	      .attr("class", "arc");

	  arc.append("path")
	      .attr("d", path)
	      .attr("fill", function(d) { return color(d.data.stat); });

	  arc.append("text")
	      .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
	      .attr("dy", "0.35em")
	      .text(function(d) { return d.data.stat; });
	});
}