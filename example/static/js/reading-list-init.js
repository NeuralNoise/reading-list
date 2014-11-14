(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    var $readingListContainer = $('#readingList');
    var $readingListMiniMapItems = $readingListContainer
      .find('.reading-list-mini-map .reading-list-mini-map-item');

    $readingListContainer.on('reading-list-item-in-looking',
      function (event, $item) {
        if ($item.children('article').length > 0) {
          var id = $item.children('article').attr('id');
          var $miniMapItem = $readingListMiniMapItems.filter('[data-item-ref="' + id + '"]').addClass('active');
        }
      });
    $readingListContainer.on('reading-list-item-out-looking', function (event, item) {
      var $item = $(item);
      if ($item.children('article').length > 0) {
        var id = $item.children('article').attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter('[data-item-ref="' + id + '"]').removeClass('active');
      }
    });

    // initialize reading list
    $readingListContainer.readingList({
      itemsToLoad: 1,
      loadingThreshold: 300,
      viewingThresholdTop: 200,
      viewingThresholdBottom: 250
    });

  });

})(window, $, IScroll);
