function drawBarGraph(array, words) {
	var dataArray = array.sort(function(a, b){ return b-a });
	var wordArray = refSort(words, array);
	wordArray = wordArray[0];
	dataArray.length = 10;
	wordArray.length = 10;

	var width = dataArray.length * 80;
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
	    color = d3.scaleLinear().range(["#FFAE73", "#FF5300"]);

	var g = svg.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.tsv("countrydata.tsv", function(d) {
	  d.count = +d.count;
	  return d;
	}, function(error, data) {d3 
	  if (error) throw error;

	  x.domain(data.map(function(d) { return d.country; }));
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
	      .attr("x", function(d) { return x(d.country); })
	      .attr("y", function(d) { return y(d.count); })
	      .attr("width", x.bandwidth())
	      .attr("height", function(d) { return height - y(d.count); });
	});

}

function drawPieChart() {

	var svg = d3.select(".pie"),
	    width = +svg.attr("width"),
	    height = +svg.attr("height"),
	    radius = Math.min(width, height) / 2,
	    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var color = d3.scaleOrdinal(["#FF5300", "#FF6C00", "#FF9140"]);

	var pie = d3.pie()
	    .sort(null)
	    .value(function(d) { return d.count; });

	var path = d3.arc()
	    .outerRadius(radius - 10)
	    .innerRadius(0);

	var label = d3.arc()
	    .outerRadius(radius - 40)
	    .innerRadius(radius - 40);

	d3.tsv("piedata.tsv", function(d) {
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

function drawWordCloud(text_string){
var common = "i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall";

var word_count = {};

var words = text_string.split(/[ '\-\(\)\*":;\[\]|{},.!?]+/);
  if (words.length == 1){
    word_count[words[0]] = 1;
  } else {
    words.forEach(function(word){
      var word = word.toLowerCase();
      if (word != "" && common.indexOf(word)==-1 && word.length>1){
        if (word_count[word]){
          word_count[word]++;
        } else {
          word_count[word] = 1;
        }
      }
    })
  }

var svg_location = "#wordcloud";
var width = $(document).width();
var height = $(document).height();

var fill = d3.scale.category20();

var word_entries = d3.entries(word_count);

var xScale = d3.scale.linear()
   .domain([0, d3.max(word_entries, function(d) {
      return d.value;
    })
   ])
   .range([10,100]);

d3.layout.cloud().size([width, height])
  .timeInterval(20)
  .words(word_entries)
  .fontSize(function(d) { return xScale(+d.value); })
  .text(function(d) { return d.key; })
  .rotate(function() { return ~~(Math.random() * 2) * 90; })
  .font("Impact")
  .on("end", draw)
  .start();

function draw(words) {
  d3.select(svg_location).append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
    .selectAll("text")
      .data(words)
    .enter().append("text")
      .style("font-size", function(d) { return xScale(d.value) + "px"; })
      .style("font-family", "Impact")
      .style("fill", function(d, i) { return fill(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) { return d.key; });
}

d3.layout.cloud().stop();
}