var express = require('express');
var app = express();
var path = require('path');
var Twitter = require('twitter'); 
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('.'))

const hostname = '127.0.0.1';
const port = 3000;

var conversation = [];
var results = [];
var searched = ' ';

var client = new Twitter({ 
	consumer_key: 'arqa9nkL9XPIgHfnPGGc1qan6',
	consumer_secret: '57KUJIkZgdEUakKpLTQ7iLkHXXCef144IHZ4h0yVCcRpKMBs9R',
	access_token_key: '923715585267023872-UPiPS9fioX4v9urtFqFntMwck5acu1S',
	access_token_secret: '0NRjoZBaNahTqGZsKrVNjFw41JJLneromZBn5LoqSNmTw'
});

app.get('/', function (appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/messages', function(appReq, appRes) {
	appRes.json(conversation);
});

app.get('/viewmessages', function(appReq, appRes) {
	appRes.sendFile(path.join(__dirname + '/messages.html'));
});

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

	results = [];
	sentHeaders = []; 

	client.get('search/tweets', {
		q: searched,
		result_type: 'recent',
		lang: 'eng',
		count: 20
		},
		
		function(error, tweets, response) {

		if(!error) {
		
		var i = 0; 

		while (i < tweets.statuses.length) { 

			var message = { 
				name: tweets.statuses[i].user.name,
				username: tweets.statuses[i].user.screen_name,
				tweet: tweets.statuses[i].user.description,
				time: tweets.statuses[i].user.created_at
			}
			i++; 
			
			sentHeaders.push(message);
		}

		results.push(sentHeaders);
		appRes.json(sentHeaders); 
	
		}
	
	});
		
});

app.get('/tweets', function(appReq, appRes) {
	appRes.json(results);
});


// Set listening prot
app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});
