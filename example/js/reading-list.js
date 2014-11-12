(function (window, $, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var windowHeight = function () {
    return window.innerHeight || window.document.documentElement.clientHeight;
  };

  /**
   * Check that some part of the article is in view + threshold.
   */
  var withinLoadingThreshold = function (el, threshold) {
    // window dimesions
    var top = -threshold;
    var bot = windowHeight() + threshold;

    // check if element bounding box is within window dimensions
    var elBounding = el.getBoundingClientRect();
    var overTop = elBounding.top < top && elBounding.bottom < top;
    var belowBot = elBounding.top > bot && elBounding.bottom > bot;

    // if the whole thing is not over the top, or the whole thing is not below the bot,
    //  some part of it must be in the view
    return !(overTop || belowBot);
  };

  $document.ready(function () {

    var $readingListContent = $('#readingListContent');
    var $readingListArticles = $('#readingListArticles');
    var $readingListItems = $readingListArticles.find('.reading-list-item');

    if ($.browser.mobile) {
      // mobile browser, use IScroll
      (new IScroll('readingListContent', {
        useNativeScroll: true
      }));
    }

    /**
     * Reading list event framework.
     */
    var eventing = function () {
      var scrollTop = $readingListContent.scrollTop();
      if (scrollTop <= 0) {
        // we're at the top of the reading list
        $readingListContent.trigger('reading-list-at-top');
      } else if (scrollTop + windowHeight() >= $readingListArticles.height()) {
        // we're at the bottom of the reading list
        $readingListContent.trigger('reading-list-at-bottom');
      }

      // see if anything is in view and determine if something should start loading
      $readingListItems.each(function (i, item) {
        var $item = $(item);
        var inThreshold = withinLoadingThreshold(item, 0);
        if(inThreshold && !$item.hasClass('in-threshold')) {
          $item.addClass('in-threshold');
          $readingListContent.trigger('reading-list-item-in-view', $item);
        } else if (!inThreshold && $item.hasClass('in-threshold')){
          $item.removeClass('in-threshold');
          $readingListContent.trigger('reading-list-item-out-view', $item);
        }
      });
    };

    $readingListContent.on('reading-list-item-in-view', function (event, item) {
      var $item = $(item);
      var name;
      if ($item.children('article').length > 0) {
        name = $item.children('article').attr('id');
      } else {
        name = 'adspace';
      }
      console.log('in view', name);
    });
    $readingListContent.on('reading-list-item-out-view', function (event, item) {
      var $item = $(item);
      var name;
      if ($item.children('article').length > 0) {
        name = $item.children('article').attr('id');
      } else {
        name = 'adspace';
      }
      console.log('out view', name);
    });
    $readingListContent.on('reading-list-at-top', function () {
      console.log('topped', $readingListContent.scrollTop());
    });
    $readingListContent.on('reading-list-at-bottom', function () {
      console.log('bottomed', $readingListContent.scrollTop());
    });

    eventing();
    $readingListContent.on('scroll', function () {
// TODO : might want to do some kind of debounce here
      eventing();
    });

  });

})(window, $, IScroll);
