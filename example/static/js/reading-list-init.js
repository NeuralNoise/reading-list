(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    // initialize reading list
    $('#readingList').readingList({
      loadingThreshold: 300,
      viewingThresholdTop: 200,
      viewingThresholdBottom: 250
    });

  });

})(window, $, IScroll);
