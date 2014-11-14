(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    // initialize reading list
    $('#readingList').readingList({
      itemsToLoad: 1,
      loadingThreshold: 300,
      viewingThresholdTop: 200,
      viewingThresholdBottom: 250
    });

  });

})(window, $, IScroll);
