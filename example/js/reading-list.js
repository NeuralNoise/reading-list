(function (window, $, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var windowHeight = function () {
    return window.innerHeight || window.document.documentElement.clientHeight;
  };

  /**
   * Check that some part of given element is in view + threshold.
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

  /**
   * Determine if a user is "looking" at an item. User is "looking" at the item if
   *  it falls within the boundaries created by the top and bottom thresholds.
   */
  var withinLookingArea = function (el, topThreshold, bottomThreshold) {
    // get top and bottom thresholds
    var lineTop = topThreshold;
    var lineBot = bottomThreshold;

    // check if element is within "looking" area dimensions
    var elBounding = el.getBoundingClientRect();
    var overTop = elBounding.top < lineTop && elBounding.bottom < lineTop;
    var belowBot = elBounding.top > lineBot && elBounding.bottom > lineBot;

    // not over the top or bottom, so some part of this is within the "looking" area
    return !(overTop || belowBot);
  };

  $document.ready(function () {

    var LOADING_THRESHOLD = 300;

    // only one threshold is really necessary depending on algo, but use both
    var VIEWING_THRESHOLD_TOP = 200;
    var VIEWING_THRESHOLD_BOT = 250;

    var $readingListMiniMap = $('#readingListMiniMap');
    var $readingListMiniMapItems = $readingListMiniMap.find('.reading-list-mini-map-item');
    var $readingListContent = $('#readingListContent');
    var $readingListArticles = $('#readingListArticles');
    var $readingListItems = $readingListArticles.find('.reading-list-item');
    var $activeItem;

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

      // check if individual reading list items are in view
      var $nowActive;
      $readingListItems.each(function (i, item) {
        var $item = $(item);
        var inThreshold = withinLoadingThreshold(item, LOADING_THRESHOLD);
        if(inThreshold && !$item.hasClass('in-threshold')) {
          $item.addClass('in-threshold');
          $readingListContent.trigger('reading-list-item-in-view', $item);
        } else if (!inThreshold && $item.hasClass('in-threshold')){
          $item.removeClass('in-threshold');
          $readingListContent.trigger('reading-list-item-out-view', $item);
        }

        // mark the higher up item in the looking area as the one being looked at
        var inLooking = withinLookingArea(item, VIEWING_THRESHOLD_TOP, VIEWING_THRESHOLD_BOT);
        if(inLooking && !$nowActive) {
          // in looking area, and we haven't assigned a now active item yet
          if (!$item.is($activeItem)) {
            // this is not the currently active item, so we'll want to fire off events and things
            if ($activeItem) {
              // new item in looking area, set it to the active item
              $activeItem.removeClass('in-looking');
              $readingListContent.trigger('reading-list-item-out-looking', $activeItem);
            }
            // add looking class to active item, trigger event
            $item.addClass('in-looking');
            $readingListContent.trigger('reading-list-item-in-looking', $item);
          }
          $nowActive = $item;
        }
      });
      // found an active item, set it to the active item
      $activeItem = $nowActive;
    };

    $readingListContent.on('reading-list-item-in-looking', function (event, item) {
      var $item = $(item);
      if ($item.children('article').length > 0) {
        var id = $item.children('article').attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter('[data-item-ref="' + id + '"]').addClass('active');
console.log('in looking', id);
      }
    });
    $readingListContent.on('reading-list-item-out-looking', function (event, item) {
      var $item = $(item);
      if ($item.children('article').length > 0) {
        var id = $item.children('article').attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter('[data-item-ref="' + id + '"]').removeClass('active');
console.log('out looking', id);
      }
    });
    $readingListContent.on('reading-list-item-in-view', function (event, item) {
      var $item = $(item);
      var name;
      if ($item.children('article').length > 0) {
        name = $item.children('article').attr('id');
      } else {
        name = 'adspace';
      }
    });
    $readingListContent.on('reading-list-item-out-view', function (event, item) {
      var $item = $(item);
      var name;
      if ($item.children('article').length > 0) {
        name = $item.children('article').attr('id');
      } else {
        name = 'adspace';
      }
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
    $readingListContent.on('resize', function () {
      eventing();
    });

  });

})(window, $, IScroll);
