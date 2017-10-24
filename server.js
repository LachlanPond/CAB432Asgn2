var express = require('express');
var app = express();
var path = require('path');
var Stream = require('user-stream');
var stream = new Stream({
	
});

app.use(express.static('/server'));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

var server = app.listen(8081, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Twitter server listening at http://%s:%s", host, port); 
});