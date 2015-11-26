var request = require("request"), 
  cheerio = require("cheerio"), 
  http = require('http'),
    fs = require('fs'),
    url = require('url');

var FeedParser = require('feedparser');
  
var loadreq;
var ok = [];


function LoadData(pag, res, search) {

  request(pag, function (error, response, body) {
  ok = [];
  if (!error) {
    var $ = cheerio.load(body);
    ok.push($('h1').first().text());

    var append = false;
    $(search).contents().each(function(i, elem) {
      if($(this).text() != "") {
      if(elem.type == 'tag') {
          ok[ok.length-1] += $(this).text();
          append = true;
        } else {
          if(append) {
          ok[ok.length-1] += $(this).text();
          append = false;
          } else {
          ok.push($(this).text());
          }
        }
      }
      });

    ok = ok.slice(0, 7);
    res.write(JSON.stringify(ok));  
    res.end();  
  } else {
    console.log("We’ve encountered an error: " + error);
  }
      
});
  
}

function getLinks(feed) {
var links = [];
var req = request(feed)
  , feedparser = new FeedParser();

req.on('error', function (error) {
  // handle any request errors
});
req.on('response', function (res) {
  var stream = this;

  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

  stream.pipe(feedparser);
});

feedparser.on('error', function(error) {
  // always handle errors
});
feedparser.on('readable', function() {
  // This is where the action is!
  var stream = this
    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
    , item;

  while (item = stream.read()) {
    links.push(item.link);
  }

});
return links;
}

var newsLinks = getLinks('http://feeds.bbci.co.uk/news/rss.xml');
var sportLinks = getLinks('http://feeds.bbci.co.uk/sport/0/rss.xml');
var footballLinks = getLinks('http://feeds.bbci.co.uk/sport/0/football/rss.xml');
var cricketLinks = getLinks('http://feeds.bbci.co.uk/sport/0/cricket/rss.xml');
var entertainmentLinks = getLinks('http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml');

var server = http.createServer(function(request, response) {  
  response.setHeader('Content-Type','application/json');
  response.setHeader('Access-Control-Allow-Origin', '*');

  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;

  var pag = query['page'];
  var links = [];

  if (pag >= 104 && pag <= 115) {
         LoadData(newsLinks[pag-104],response,'p');
  } else if (pag >= 303 && pag <= 314) {
         LoadData(footballLinks[pag-303],response,'.article p');
  } else if (pag >= 320 && pag <= 331) {
         LoadData(sportLinks[pag-320],response, '.article p');
  } else if (pag >= 341 && pag <= 352) {
         LoadData(cricketLinks[pag-341],response, '.article p');
  } else if (pag >= 501 && pag <= 512) {
         LoadData(entertainmentLinks[pag-501],response, 'p');
  } else {
    
  }
   
  
  
 

});
var port_number = server.listen(process.env.PORT || 8080);
server.listen(port_number);
