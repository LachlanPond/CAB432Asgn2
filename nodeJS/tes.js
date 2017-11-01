var express = require('express');
var router = express.Router(); 

/*
 * Import all relevant packages
 */
var Twitter = require('twitter'); 
var bodyParser = require('body-parser');
var natural = require('natural');
var tsv = require('tsv');
var fs = require('fs');
var nounInflector = new natural.NounInflector();
var tokenizer = new natural.WordTokenizer();
var sentiment = require('sentiment'); 
var lookup = require('country-data').lookup;
var cities = require("cities-list");
var google = require('@google/maps');
var checkword = require('check-word'),
	words = checkword('en');
var names = require('people-names');

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
 * Method: Post
 * Source: '/tweets'
 * Output: Stream from the queried input adding all
 * tweets to the list 'result'. Also filters each individual
 * word and adds to the required list
 */
router.post('/', function(appReq, appRes) {
    
        // Stream from Twitter
        var stream = client.stream('statuses/filter', {
            track: 'Aus',
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

module.exports = router