(function (window, $, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var inView = function (el, offset) {
    var relativeWindowBottom = window.innerHeight || window.document.documentElement.clientHeight;
    return el.getBoundingClientRect().top <= (relativeWindowBottom - offset) &&
            el.getBoundingClientRect().bottom >= offset;
  };

  $document.ready(function () {

    var $readingListContent = $('#readingListContent');
    var $sections = $readingListContent.find('.article,.adspace');

    if ($.browser.mobile) {
      // mobile browser, use IScroll
      (new IScroll('readingListContent', {
        useNativeScroll: true
      }));
    }

    $readingListContent.on('scroll', function () {

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

  });

})(window, $, IScroll);
