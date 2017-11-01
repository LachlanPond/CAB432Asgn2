/*
 * Twitter Analysis
 * For CAB403, Assignment 2
 * By Luke Pritchard & Lachlan Pond
 */

/*
 * Import all relevant packages
 */
var express = require('express');
var app = express();
var path = require('path');
var Twitter = require('twitter'); 
var bodyParser = require('body-parser');
var natural = require('natural');
var tsv = require('tsv');
var fs = require('fs');
var nounInflector = new natural.NounInflector();
var tokenizer = new natural.WordTokenizer();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('.'));
var sentiment = require('sentiment'); 
var lookup = require('country-data').lookup;
var cities = require("cities-list");
var google = require('@google/maps');
var checkword = require('check-word'),
	words = checkword('en');
var names = require('people-names');

/* 
 * Set up ports
 */
const hostname = '127.0.0.1';
const port = 3000;

/*
 * Set up global variables
 */
var conversation = [];
var results = [];
var searched = '';
var currentlySearched = '';
var allTweets = '';
var allTweetsArray = [];
var countries = [];

// Make sure top 15 file is deleted
fs.writeFile("data/top15.txt", '', function(err) { 
	if(err) { 
		return console.log(err); 
	}
});

/*
 * Set up variables relating positive and 
 * negative count for pie chart */ 
var posCount = 0; 
var negCount = 0;
var mutualCount = 0;  
var totalAmount = 0;

/*
 * Set up Twitter client keys
 */ 
var client = new Twitter({ 
	consumer_key: 'arqa9nkL9XPIgHfnPGGc1qan6',
	consumer_secret: '57KUJIkZgdEUakKpLTQ7iLkHXXCef144IHZ4h0yVCcRpKMBs9R',
	access_token_key: '923715585267023872-UPiPS9fioX4v9urtFqFntMwck5acu1S',
	access_token_secret: '0NRjoZBaNahTqGZsKrVNjFw41JJLneromZBn5LoqSNmTw'
});

/*
 * Method: Get
 * Source: '/'
 * Output: Results of the searched stream
 */
app.get('/', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/index.html'));
});

/*
 * Method: Get
 * Source: '/wordMode'
 * Output: Graph showing modal of words
 */
app.get('/wordMode', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/wordMode.html'));
});

/*
 * Method: Get
 * Source: '/tweetspiechart'
 * Output: Pie chart of ration of positive and negative
 * tweets
 */
app.get('/tweetspiechart', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/tweetspiechart.html'));
});

/*
 * Method: Get
 * Source: '/messages'
 * Output: JSON object of all the tweets
 */
app.get('/messages', function(appReq, appRes) {
	appRes.json(conversation);
});

/*
 * Method: Get
 * Source: '/viewmessages'
 * Output: All the user entered searches in the system
 */
app.get('/viewmessages', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/messages.html'));
});

/*
 * Method: Get
 * Source: '/wordcloud'
 * Output: Wordcloud of modal of result words
 */
app.get('/wordcloud', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/wordcloud.html'));
});

/*
 * Method: Post
 * Source: '/messages'
 * Output: Adds the queried stream into the list
 * 'conversation' 
 */
app.post('/messages', function(appReq, appRes) {

	var message = {
		ip: appReq.ip,
		timestamp: new Date(),
		text: appReq.body.text
	}

	searched = appReq.body.text;

	conversation.push(message);
	appRes.json(message);
	
});

/*
 * Method: Post
 * Source: '/tweets'
 * Output: Stream from the queried input adding all
 * tweets to the list 'result'. Also filters each individual
 * word and adds to the required list
 */
app.post('/tweets', function(appReq, appRes) {

	// Stream from Twitter
	var stream = client.stream('statuses/filter', {
		track: searched,
		language: 'en'
	});

	// Start the stream
	stream.on('data', function(event) {

		// Make date stamp
		if (event.user != undefined) {
			var date = event.user.created_at;
			var dateStr = tokenizer.tokenize(date);

		// Covert from String 'Jan' to an integer representation 
		switch(dateStr[1]) { 
			case 'Jan':
				dateStr[1] = 1; 
				break; 
			case 'Feb': 
				dateStr[1] = 2;
				break;
			case 'Mar':
				dateStr[1] = 3;
				break;
			case 'Apr': 
				dateStr[1] = 4; 
				break;
			case 'May':
				dateStr[1] = 5; 
				break; 
			case 'Jun': 
				dateStr[1] = 6;
				break;
			case 'Jul':
				dateStr[1] = 7;
				break;
			case 'Aug': 
				dateStr[1] = 8; 
				break;
			case 'Sep':
				dateStr[1] = 9; 
				break; 
			case 'Oct': 
				dateStr[1] = 10;
				break;
			case 'Nov':
				dateStr[1] = 11;
				break;
			case 'Dec': 
				dateStr[1] = 12; 
				break;
		}

		// Create the time stamp in seconds (This is used for sorting the data)
		var dateSec = dateStr[7] * 365 * 24 * 60 * 60 + //yr
			dateStr[1] * 30 * 24 * 60 * 60 + //month
			dateStr[2] * 24 * 60 * 60 + //day
			dateStr[3] * 24 * 60 + //hr
			dateStr[4] * 60 +// mins
			dateStr[5]; //seconds

		// Create result JSON parameters
		var message = { 
			name: event.user.name, 
			username: event.user.screen_name,
			time: event.user.created_at,
			tweet: event.user.description,
			timestamp: dateSec
		}
		// Make sure is a valid tweet and not empty
		if(message.tweet != null) {
			
			// Add the message to the results array as JSON
			results.push(message);
		
			// Sort the results by timestamp
			results.sort(function(a, b) { 
				return b.timestamp - a.timestamp;
			});

		
			var output = "";
			var count = 0;

			// Find the length of the results,
			// Make sure we dont take more than the top
			// 15 results
			if(results.length < 15) { 
				count = results.length-1;
			} else { 
				count = 14;
			}

			// Add the top 15 to the results
			while(count > -1) { 
				var msg = results[count];
				output += '<h3>'+msg.name+' (@'+msg.username+')</h3>';
				output += '<p>'+msg.tweet+'</p>'; 
				output += '<p><i>'+msg.time+'</i></p>';
				count--;
			}

			// Write the top 15 to the results file 
			fs.writeFile("data/top15.txt", output, function(err) { 
				if(err) { 
					return console.log(err); 
				}
			});

			// Use sentiment package to tell whether the message is positive or negative
			var description = event.user.description;
			if(sentiment(description).score > 0) { // Positive post
				posCount++; 
			} else if (sentiment(description).score == 0) { // Neutral post
				mutualCount++;
			} else {  // Negative post
				negCount++; 
			}
			totalAmount++;

			// Split the string to extract each word
			var splitStr = tokenizer.tokenize(description); // Split by a space'
			var newStr = []; 

			// Begin the disection of the string by looking at each contained word
			var i = 0; 
			while (i < splitStr.length) { // Cycle through each word in the message
				if(isNaN(parseFloat(splitStr[i])) && !isFinite(splitStr[i])) { // Make sure the  word is valid
					if(splitStr[i].length > 2) { // Make sure the word is of length 

						// Singularize the word and convert is to lowercase to ensure no uncessay duplicates
						var word = nounInflector.singularize(splitStr[i].toLowerCase());

						// Check if an English word, or is a persons name, or is a country, or is a city
						if(words.check(word) || names.isPersonName(word) || lookup.countries({name: splitStr[i]})[0] != undefined
							|| cities[word] != undefined) { 
							
							newStr.push(word); // Add word to list of words
							
							// If its a country, add to country list
							var country = lookup.countries({name: splitStr[i]})[0];
							if(country != undefined) { 
								countries.push(splitStr[i]); // Add country to list of countries
							} 
							
							// If it is a city, get the country
							if(cities[word] == 1) { 

								// Set up the Google client
								var googleClient = google.createClient({
									key: 'AIzaSyCqJSEIN_kQHhmIO9-bBNA47Jhj-Wz-HLA', 
								});
								
								// Query the inputted city
								googleClient.geocode({
									address: word
									}, function(err, result){
									// Add the country name to the list of countries
									if(!err){
										countries.push((result.json.results[0].address_components[2].long_name).toLowerCase);
									}
								});
							}					
						} 		
					}
				}		
				i++; 
			}
		}
		allTweets += newStr + ","; // Add to list of tweet words
	}
	});
});


/*
 * Method: Get
 * Source: '/alltweets'
 * Output: JSON array of all tweets with no commas involved
 */
app.get('/alltweets', function(appReq, appRes) {
	allTweetsNoCommas = allTweets.replace(/,/g , " ");
	appRes.json(allTweetsNoCommas);
});

/*
 * Method: Get
 * Source: '/tweets'
 * Output: JSON array of all the recieved tweets
 */
app.get('/tweets', function(appReq, appRes) {
	appRes.json(results);
});



/*
 * Method: Get
 * Source: '/countries'
 * Output: List of all the detected countries
 */
app.get('/countries', function(appReq, appRes) {
	appRes.json(countries);

	/* ---Modify the data to make it saveable as a .tsv file--- */
	// Count the amount of times each country was mentioned
	var tsvData = countArrayElements(countries);
	// Split the data into two arrays and sort both from highest count to lowest
	var dataArray = tsvData[1].sort(function(a, b){ return b-a; });
	var wordArray = refSort(tsvData[0], tsvData[1]);
	wordArray = wordArray[0];
	wordArray.length = 10;
	dataArray.length = 10;
	var dataWordJson = convertTwoArraysToJson(wordArray, dataArray);
	tsvString = tsv.stringify(dataWordJson);

	fs.writeFile("data/countrydata.tsv", tsvString, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});

});

/*
 * Method: Get
 * Source: '/statistics'
 * Output: Options to choose which statistic to view
 */
app.get('/statistics', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/analystics.html'));
});

/*
 * Method: Get
 * Source: '/statisticsdata'
 * Output: ALl the statistical data fro the graphs
 */
app.get('/statisticsData', function(appReq, appRes) {
	var perc = 100 / (posCount + negCount + mutualCount);
	var stats = [];

	var statistic = [{"stat": "Positive " + Math.round(posCount*perc) + "%" , "count": posCount},
					{"stat": "Negative " + Math.round(negCount*perc) + "%" , "count": negCount},
					{"stat": "Neutral " + Math.round(mutualCount*perc) + "%" , "count": mutualCount}];

	tsvString = tsv.stringify(statistic);
	fs.writeFile("data/piedata.tsv", tsvString, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The pie data file was saved!");
	});

	appRes.json(statistic);
});

/*
 * Method: Get
 * Source: 'any invalid source file'
 * Output: error handling page
 */
app.get('/*', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/pages/error.html'));
});


/*
 * Start listening on the server
 */
app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});



/*
 * Count all the elements in the array
 */
function countArrayElements(array) {
	var a = []; b = []; prev = null;
	var arr = array;
	arr.slice().sort();
	var obj = {};
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] !== prev) {
			a.push(arr[i]);
			b.push(1);
		}
		else {
			b[b.length-1]++;
		}
		prev = arr[i];
	}
	return [a,b];
}

/*
 * Convert twoarrays to JSON
 */
function convertTwoArraysToJson(a, b) {
	var obj = [];
	var inner = {};
	for (var i = 0; i < a.length; i++) {
		inner = {
			"country": a[i],
			"count": b[i]
		};
		obj.push(inner);
	}
	return obj; 
}

/*
 * Sort via zipped file
 */
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
		return (b.count) - (a.count);
	});

	var a = []; b = [];
	for (var i = 0; i < zipped.length; i++) {
		a.push(zipped[i].word);
		b.push(zipped[i].count);
	}

	return [a,b];
}

/*
 * Convert pie data to JSON 
 */
function convertPieArraysToJson(a, b) {
	var obj = [];
	var inner = {};
	for (var i = 0; i < a.length; i++) {
		inner = {
			"stat": a[i],
			"value": b[i]
		};
		obj.push(inner);
	}
	return obj; 
}