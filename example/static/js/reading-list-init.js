(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    // initialize reading list
    $('#readingList').readingList({
      loadingThreshold: 300,
      viewingThresholdTop: 200,
      viewingThresholdBottom: 250
    }).on('reading-list-item-progress', function (e, $item, progress) {
      $('.article-progress').css('width', Math.floor(progress * 100) + '%');
    });

  });

})(window, $, IScroll);
