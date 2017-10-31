/*
 * Twitter Analysis
 * For CAB403, Assignment 1
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

// Post Neg related
var posCount = 0; 
var negCount = 0;
var mutualCount = 0;  
var totalAmount = 0;

// Set up our Twitter client ID
var client = new Twitter({ 
	consumer_key: 'arqa9nkL9XPIgHfnPGGc1qan6',
	consumer_secret: '57KUJIkZgdEUakKpLTQ7iLkHXXCef144IHZ4h0yVCcRpKMBs9R',
	access_token_key: '923715585267023872-UPiPS9fioX4v9urtFqFntMwck5acu1S',
	access_token_secret: '0NRjoZBaNahTqGZsKrVNjFw41JJLneromZBn5LoqSNmTw'
});

// Index page
app.get('/', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/index.html'));
});

// Graph of words
app.get('/wordMode', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/wordMode.html'));
});

// Pie chart of positive/negatives
app.get('/tweetspiechart', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/tweetspiechart.html'));
});

// JSON page where our search is held
app.get('/messages', function(appReq, appRes) {
	appRes.json(conversation);
});

// User frendly GUI displaying JSON results of querired searches
app.get('/viewmessages', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/messages.html'));
});

// Post the querired search 
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

app.post('/tweets', function(appReq, appRes) {

	// Stream from Twitter
	var stream = client.stream('statuses/filter', {
		track: searched,
		language: 'en'
	});

	stream.on('data', function(event) {

		// Make date stamp
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
			dateStr[2] * 24 * 60 * 60 + //dau
			dateStr[3] * 24 * 60 + //hr
			dateStr[4] * 60 +// mins
			dateStr[5]; //seconds

		// Create the message parametets
		var message = { 
			name: event.user.name,
			username: event.user.screen_name,
			time: event.user.created_at,
			tweet: event.user.description,
			timestamp: dateSec
		}

		// Add the message to the results
		if(message.tweet != null) { 
			results.push(message);
		}
		

		// Sort the results by timestamp
		results.sort(function(a, b) { 
			return b.timestamp - a.timestamp;
		});

		// Use sentiment package to tell whether the message is positive or negative
		var description = event.user.description;
		if(sentiment(description).score > 0) { 
			posCount++; 
		} else if (sentiment(description).score == 0) {
			mutualCount++;
		} else {  
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
						
						newStr.push(word);
						
						//console.log(word); 
			
						
						// If its a country, add to country list
						var country = lookup.countries({name: splitStr[i]})[0];
						if(country != undefined) { 
							countries.push(splitStr[i]);
						} 
						
						// If it is a city, get the country
						if(cities[word] == 1) { 

							
							var googleClient = google.createClient({
								key: 'AIzaSyCqJSEIN_kQHhmIO9-bBNA47Jhj-Wz-HLA', 
							});
							
							googleClient.geocode({
								address: word
								}, function(err, result){
						
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

		allTweets += newStr + ","; // Add to list of tweet words

	});

	stream.on('error', function(error) {
		//throw error;
	});

});


app.get('/alltweets', function(appReq, appRes) {

	allTweetsArray = allTweets.split(',');
	appRes.json(allTweetsArray);
	var tsvData = countArrayElements(allTweetsArray);
	var dataArray = tsvData[1].sort(function(a, b){ return b-a; });
	var wordArray = refSort(tsvData[0], tsvData[1]);
	wordArray = wordArray[0];
	wordArray.length = 30;
	dataArray.length = 30;
	var dataWordJson = convertTwoArraysToJson(wordArray, dataArray);
	tsvString = tsv.stringify(dataWordJson);

	fs.writeFile("data.tsv", tsvString, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});
});

app.get('/tweets', function(appReq, appRes) {
	appRes.json(results);
});

app.get('/countries', function(appReq, appRes) {
	appRes.json(countries);
});


app.get('/statistics', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/analystics.html'));
});

app.get('/statisticsData', function(appReq, appRes) {
	var stats = [];

	var statistic = [{"stat": "Positive", "count": posCount},
					{"stat": "Negative", "count": negCount},
					{"stat": "Neutral", "count": mutualCount}];

	tsvString = tsv.stringify(statistic);
	fs.writeFile("piedata.tsv", tsvString, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The pie data file was saved!");
	});

	appRes.json(statistic);
});

app.get('/posNeg', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/posNeg.html'));
});


// Set listening prot
app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});

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

function convertTwoArraysToJson(a, b) {
	var obj = [];
	var inner = {};
	for (var i = 0; i < a.length; i++) {
		inner = {
			"word": a[i],
			"count": b[i]
		};
		obj.push(inner);
	}
	return obj; 
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
		return (b.count) - (a.count);
	});

	var a = []; b = [];
	for (var i = 0; i < zipped.length; i++) {
		a.push(zipped[i].word);
		b.push(zipped[i].count);
	}

	return [a,b];
}

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