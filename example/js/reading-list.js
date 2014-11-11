(function (window, $, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);
  var $readingListContent;

  $document.ready(function () {

    $readingListContent = $('#readingListContent');

    if ($.browser.mobile) {
      // mobile browser, use IScroll
      (new IScroll('readingListContent', {
        useNativeScroll: true
      }));
    }

    // START DEBUG STUFF
    var $debugScrollHeight = $('#debugScrollHeight');
    var $debugScrollHeightMobile = $('#debugScrollHeightMobile');
    $readingListContent.on('scroll', function () {
      $debugScrollHeight.html('scroll: ' + $readingListContent.scrollTop());
    });
    // END DEBUG STUFF
  });

})(window, $, IScroll);
