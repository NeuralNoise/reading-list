(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    // initialize reading list
    $('#readingList').readingList()
      .on('reading-list-item-progress', function (e, $item, progress) {
        $('.article-progress').css('width', Math.floor(progress * 100) + '%');
      });

  });

})(window, $, IScroll);
