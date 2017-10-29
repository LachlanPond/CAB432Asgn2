var express = require('express');
var app = express();
var path = require('path');
var Twitter = require('twitter'); 
var bodyParser = require('body-parser');
var natural = require('natural');
var nounInflector = new natural.NounInflector();
var tokenizer = new natural.WordTokenizer();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('.'))

const hostname = '127.0.0.1';
const port = 3000;

var conversation = [];
var results = [];
var searched = ' ';
var allTweets = '';
var allTweetsArray = [];

// Set up our Twitter client ID
var client = new Twitter({ 
	consumer_key: 'arqa9nkL9XPIgHfnPGGc1qan6',
	consumer_secret: '57KUJIkZgdEUakKpLTQ7iLkHXXCef144IHZ4h0yVCcRpKMBs9R',
	access_token_key: '923715585267023872-UPiPS9fioX4v9urtFqFntMwck5acu1S',
	access_token_secret: '0NRjoZBaNahTqGZsKrVNjFw41JJLneromZBn5LoqSNmTw'
});

// Index page
app.get('/', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/inde..html'));
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
		var splitStr = tokenizer.tokenize(desc); // Split by a space'
		var newStr = []; 

		var i = 0; 
		// Cycle through list
		while (i < splitStr.length) { 
			// Make sure not a number
			if(isNaN(parseFloat(splitStr[i])) && !isFinite(splitStr[i])) { 
				// Make sure not single or no charecter
				if(splitStr[i].length > 1) { 
					newStr.push(nounInflector.singularize(splitStr[i].toLowerCase()));
				}
			}		
			i++; 
		}

		allTweets += newStr + ","; // Add to list of tweet words

		console.log(newStr);

	});

	stream.on('error', function(error) {
		//throw error;
	});

});

app.get('/twitterRes', function(appReq, appRes) {
	appRes.json(allTweets);
});

app.get('/alltweets', function(appReq, appRes) {
	allTweetsArray = allTweets.split(',');
	appRes.json(allTweetsArray);
});

app.get('/tweets', function(appReq, appRes) {
	appRes.json(results);
});


app.get('/statisics', function(appReq, appRes) {
	appRes.write("<h1>Most queried search</h1>"); 

	// Write code to determine most frequent from allSeacrhed


	appRes.end();
});



// Set listening prot
app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});
