(function ($) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  // reading list specific elements
  var $readingListContainer;
  var $readingListContent;
  var $readingListItemsContainer;
  var $readingListItems;

  // plugin settings
  var settings;

  // ensure we always have the correct window height, but retrieve it only when
  //  necessary
  var windowHeight = $window.height();
  $window.on('resize', function () {
    windowHeight = $window.height();
  });

  /**
   * Use an element's bounding box to determine if it's within an area defined
   *  by the top and bot boundaries.
   */
  var elementInsideArea = function (el, top, bot) {
    // check if element bounding box is within area
    var elBounding = el.getBoundingClientRect();
    var overTop = elBounding.top < top && elBounding.bottom < top;
    var belowBot = elBounding.top > bot && elBounding.bottom > bot;

    // if the whole thing is not over the top, or the whole thing is not below
    //  the bot some part of it must be in the area
    return !(overTop || belowBot);
  };

  /**
   * Check that some part of given element is in view + threshold. Use this to
   *  determine if a reading list item is in the proximity of the window and
   *  should probably be loaded.
   */
  var withinLoadingThreshold = function (el, threshold) {
    // check if element is inside threshold
    return elementInsideArea(el, -threshold, windowHeight + threshold);
  };

  /**
   * Determine if a user is "looking" at an item. User is "looking" at the item
   *  if it falls within the boundaries created by the top and bottom
   *  thresholds, which are calculated as distances from the window top.
   */
  var withinLookingArea = function (el, topThreshold, bottomThreshold) {
    // check if element is inside threshold
    return elementInsideArea(el, topThreshold, bottomThreshold);
  };

  /**
   * Scroll event function. Keeps track of $activeItem which is the item
   *  currently being "looked" at, fires off events related to reading list
   *  movement.
   */
  var $activeItem;
  var eventing = function () {
    var scrollTop = $readingListContent.scrollTop();
    if (scrollTop <= 0) {
      // we're at the top of the reading list
      $readingListContainer.trigger('reading-list-at-top');
    } else if (scrollTop + windowHeight >=
        $readingListItemsContainer.height()) {
      // we're at the bottom of the reading list,
      $readingListContainer.trigger('reading-list-at-bottom');
    }

    // check if individual reading list items are in view
    var $nowActive;
    $readingListItems.each(function (i, item) {
      var $item = $(item);

      // check for firing within loading threshold events
      var inThreshold = withinLoadingThreshold(item, settings.loadingThreshold);
      if(inThreshold && !$item.hasClass('in-threshold')) {
        // item within threshold, fire in event
        $item.addClass('in-threshold');
        $readingListContainer.trigger('reading-list-item-in-view', $item);
      } else if (!inThreshold && $item.hasClass('in-threshold')){
        // item has left threshold, fire out event
        $item.removeClass('in-threshold');
        $readingListContainer.trigger('reading-list-item-out-view', $item);
      }

      // mark the higher up item in the looking area as the one being looked at
      var inLooking = withinLookingArea(item, settings.viewingThresholdTop,
        settings.viewingThresholdBottom);
      if(inLooking && !$nowActive) {
        // in looking area, and we haven't assigned a now active item yet
        if (!$item.is($activeItem)) {
          // this is not the currently active item, so we'll want to fire off
          //  events and things
          if ($activeItem) {
            // new item in looking area, set it to the active item
            $activeItem.removeClass('in-looking');
            $readingListContainer.trigger('reading-list-item-out-looking',
              $activeItem);
          }
          // add looking class to active item, trigger event
          $item.addClass('in-looking');
          $readingListContainer.trigger('reading-list-item-in-looking', [$item]);
        }
        $nowActive = $item;
      }
    });
    // found an active item, set it to the active item
    $activeItem = $nowActive;
  };

  $.fn.readingList = function (options) {
    settings = $.extend({
      // height from the top and bottom of window to start loading items
      loadingThreshold: 300,
      // top boundary of "looking" area, measured from top of window
      viewingThresholdTop: 200,
      // bottom boundary of "looking" area, measured from bottom of window
      viewingThresholdBottom: 250
    }, options);

    // find elements that will be used
    $readingListContainer = this;
    $readingListContent = $readingListContainer.find('.reading-list-content');
    $readingListItemsContainer =
      $readingListContent.find('.reading-list-items');
    $readingListItems = $readingListItemsContainer.find('.reading-list-item');

    // fire off initial eventing
    eventing();

    // bind other events
    $readingListContent.on('scroll', eventing);
    $window.on('resize', eventing);

    return this;
  };

})(jQuery);
