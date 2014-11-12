var connect = require('connect');
var serveStatic = require('serve-static');
var open = require('open');
var loreumIpsum = require('lorem-ipsum');
var slugify = require('slugify');

var app = connect();

// some constants
var PORT = 3000;
var HOME_PAGE = 'example.html';

// set up 3rd party middleware
app.use(serveStatic('example', {index: [HOME_PAGE]}));
app.use(serveStatic('bower_components', {index: false, extensions: ['html', 'css']}));

// make endpoints for some test articles
app.use('/article', function articleMiddleware(req, res, next) {

  var title = loreumIpsum({
    sentenceLowerBound: 2,
    sentenceUpperBound: 8
  }).replace('.', '');

  var article = {
    id: slugify(title).toLowerCase() + '-' + Math.floor(Math.random() * 100),
    title: title,
    body: loreumIpsum({
      units: 'paragraphs',
      paragraphLowerBound: 1,
      paragraphUpperBound: 10
    }).replace('\r\n', '')
  };

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(article));
});

// start server
app.listen(PORT);

// open browser
open('http://localhost:' + PORT + '/' + HOME_PAGE);
