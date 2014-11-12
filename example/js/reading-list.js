(function (window, $, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var windowHeight = function () {
    return window.innerHeight || window.document.documentElement.clientHeight;
  };

  var inView = function (el, offset) {
    return el.getBoundingClientRect().top <= (windowHeight() - offset) &&
            el.getBoundingClientRect().bottom >= offset;
  };

  $document.ready(function () {

    var $readingListContent = $('#readingListContent');
    var $readingListArticles = $('#readingListArticles');
    var $sections = $readingListArticles.find('.article,.adspace');

    if ($.browser.mobile) {
      // mobile browser, use IScroll
      (new IScroll('readingListContent', {
        useNativeScroll: true
      }));
    }

    var eventing = function () {
      var scrollTop = $readingListContent.scrollTop();
      if (scrollTop <= 0) {
        $readingListContent.trigger('reading-list-at-top');
      } else if (scrollTop + windowHeight() >= $readingListArticles.height()) {
        $readingListContent.trigger('reading-list-at-bottom');
      }

      // TODO : add list of things, along with offsets to check if they are in view, maybe have data attrs
    };

    $readingListContent.on('scroll', function () {
      eventing();

      $sections.each(function (i, article) {

        if(inView(article, -300)) {
          article.style.backgroundColor =  '#00f';
        } else {
          article.style.backgroundColor = '';
        }

      });

      // START DEBUG STUFF
      $('#debugScrollHeight').html('scroll: ' + $readingListContent.scrollTop());
      $('#debugInnerHeight').html('innerHeight: ' + (window.innerHeight || window.document.documentElement.clientHeight));
      // END DEBUG STUFF
    });

    $readingListContent.on('reading-list-at-top', function (events) {
      console.log('topped ' + $readingListContent.scrollTop());
    });
    $readingListContent.on('reading-list-at-bottom', function (events) {
      console.log('bottomed ' + $readingListContent.scrollTop());
    });

  });

})(window, $, IScroll);
