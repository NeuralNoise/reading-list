var connect = require('connect');
var serveStatic = require('serve-static');
var open = require('open');

var app = connect();

// some constants
var PORT = 3000;
var HOME_PAGE = 'example.html';

// start server
app.use(serveStatic('example', {index: [HOME_PAGE]}));
app.use(serveStatic('bower_components', {index: false, extensions: ['html', 'css']}));
app.listen(PORT);

// open browser
open('http://localhost:' + PORT + '/' + HOME_PAGE);
