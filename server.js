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
app.use(express.static('.'))
var sentiment = require('sentiment'); 
var lookup = require('country-data').lookup;
var cities = require("all-the-cities") 

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
var searched = ' ';
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

app.get('/wordMode', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/wordMode.html'));
});

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

	var stream = client.stream('statuses/filter', {
		track: searched,
		language: 'en'
	});

	stream.on('data', function(event) {
		
		var message = { 
			name: event.user.name,
			username: event.user.screen_name,
			time: event.user.created_at,
			tweet: event.user.description
		}

		results.push(message);
		results.sort(function(a, b) { 
			return a.name < b.name;
		});

		var desc = event.user.description;

		// Pos Neg count
		if(sentiment(desc).score > 0) { 
			posCount++; 
		} else if (sentiment(desc).score == 0) {
			mutualCount++;
		} else {  
			negCount++; 
		}
		totalAmount++;

		var splitStr = tokenizer.tokenize(desc); // Split by a space'
		var newStr = []; 

		var i = 0; 
		// Cycle through list
		while (i < splitStr.length) { 
			// Make sure not a number
			if(isNaN(parseFloat(splitStr[i])) && !isFinite(splitStr[i])) { 
				// Make sure not single or no charecter
				if(splitStr[i].length > 1) { 

					var france = lookup.countries({name: splitStr[i]})[0];
					if(france == undefined) { 
						//continue;
					} else { 
						countries.push(splitStr[i]);
					}

					newStr.push(nounInflector.singularize(splitStr[i].toLowerCase()));

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
	countriesArray = countries.split(',');
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