(function (window, $, IScroll) {
  'use strict';

  $(document).on('ready', function () {

    // initialize reading list
    $('#readingList').readingList({
      addContent: function () {
        var deferred = $.Deferred();
        deferred.resolve('<div>MOAR CONTENT!</div>');
        return deferred.promise();
      }
    })
    .on('reading-list-item-progress', function (e, $item, progress) {
      $('.article-progress').css('width', Math.floor(progress * 100) + '%');
    });

  });

})(window, $, IScroll);
