var connect = require('connect');
var loreumIpsum = require('lorem-ipsum');
var open = require('open');
var serveStatic = require('serve-static');
var slugify = require('slugify');
var swig = require('swig');

var app = connect();

// some utility stuff
var makeArticle = function (title, id) {
   return {
    slug: slugify(title).toLowerCase() + '-' + id,
    title: title,
    body: loreumIpsum({
      units: 'paragraphs',
      paragraphLowerBound: 20,
      paragraphUpperBound: 100
    }).replace('\r\n', '')
  };
};

// some constants
var PORT = 3000;
var HOME_PAGE = 'example.html';

// set up 3rd party middleware
app.use(serveStatic('example/static', {index: [HOME_PAGE]}));
app.use(serveStatic('bower_components', {index: false, extensions: ['html', 'css']}));

app.use('/lists/1', function (req, res, next) {
  var readingList = {
    items: [
      {
        slug: 'veniam-exercitation-in-tempor-1',
        title: 'Veniam Exercitation In Tempor',
        type: 'article'
      },
      {
        type: 'ad'
      },
      {
        slug: 'lorem-officia-duis-2',
        title: 'Lorem Officia Duis',
        type: 'article'
      },
      {
        type: 'ad'
      },
      {
        slug: 'minim-anim-id-anim-3',
        title: 'Minim Anim id Anim',
        type: 'article'
      },
      {
        type: 'ad'
      },
      {
        slug: 'lorem-proident-non-4',
        title: 'Lorem Proident Non',
        type: 'article'
      }
    ]
  };

  res.end(
    swig.renderFile('example/templates/reading-list.html', readingList)
  );
});

// make endpoint for some test ads
app.use('/ad', function (req, res, next) {
  res.end(
    swig.renderFile('example/templates/ad.html',
      {
        body: 'THIS IS AN AD ' + loreumIpsum({
          sentenceLowerBound: 2,
          sentenceUpperBound: 8
        }).replace('.', '')
      }
    )
  );
});

// make endpoints for some test articles
app.use('/article/veniam-exercitation-in-tempor-1', function (req, res, next) {
  res.end(
    swig.renderFile('example/templates/article.html',
      makeArticle('Veniam Exercitation In Tempor', 1)
    )
  );
});
app.use('/article/lorem-officia-duis-2', function (req, res, next) {
  res.end(
    swig.renderFile('example/templates/article.html',
      makeArticle('Lorem Officia Duis', 2)
    )
  );
});
app.use('/article/minim-anim-id-anim-3', function (req, res, next) {
  res.end(
    swig.renderFile('example/templates/article.html',
      makeArticle('Minim Anim id Anim', 3)
    )
  );
});
app.use('/article/lorem-proident-non-4', function (req, res, next) {
  res.end(
    swig.renderFile('example/templates/article.html',
      makeArticle('Lorem Proident Non', 4)
    )
  );
});

// start server
app.listen(PORT);

// open browser
open('http://localhost:' + PORT + '/' + HOME_PAGE);
