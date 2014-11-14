(function ($, IScroll) {
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
  var withinLoadingThreshold = function (el) {
    // check if element is inside threshold
    var threshold = settings.loadingThreshold;
    return elementInsideArea(el, -threshold, windowHeight + threshold);
  };

  /**
   * Determine if a user is "looking" at an item. User is "looking" at the item
   *  if it falls within the boundaries created by the top and bottom
   *  thresholds, which are calculated as distances from the window top.
   */
  var withinLookingArea = function (el) {
    // check if element is inside threshold
    var topThreshold = settings.viewingThresholdTop;
    var botThreshold = settings.viewingThresholdBottom;
    return elementInsideArea(el, topThreshold, botThreshold);
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
      var inThreshold = withinLoadingThreshold(item);
      if(inThreshold && !$item.hasClass('js-in-threshold')) {
        // item within threshold, fire in event
        $item.addClass('js-in-threshold');
        $readingListContainer.trigger('reading-list-item-in-view', [$item]);
      } else if (!inThreshold && $item.hasClass('js-in-threshold')){
        // item has left threshold, fire out event
        $item.removeClass('js-in-threshold');
        $readingListContainer.trigger('reading-list-item-out-view', [$item]);
      }

      // mark the higher up item in the looking area as the one being looked at
      var inLooking = withinLookingArea(item);
      if(inLooking && !$nowActive) {
        // in looking area, and we haven't assigned a now active item yet
        if (!$item.is($activeItem)) {
          // this is not the currently active item, so we'll want to fire off
          //  events and things
          if ($activeItem) {
            // new item in looking area, set it to the active item
            $activeItem.removeClass('js-in-looking');
            $readingListContainer.trigger('reading-list-item-out-looking',
              [$activeItem]);
          }
          // add looking class to active item, trigger event
          $item.addClass('js-in-looking');
          $readingListContainer.trigger('reading-list-item-in-looking',
            [$item]);
        }
        $nowActive = $item;
      }
    });
    // found an active item, set it to the active item
    $activeItem = $nowActive;
  };

  /**
   * GET an item from reading list. Returns a promise that resolves when the
   *   response comes back from the server.
   */
  var retrieveReadingListItem = function ($readingListItem) {
    var href = $readingListItem.data('href');
    return $.get(href);
  };

  /**
   * Ensure everything within the loading threshold is loaded.
   */
  var retrieveReadingListItemsInLoadingArea = function () {

/* TODO : fill this in
This algo should be along the lines:
1. Check url to see if there's an article specified
  - if true: use that as first item to load
  - if false: use first item in list as item to load
2. Load first article
3. Test if anything in loading zone needs to be loaded still
4. Choose an unloaded article in loading zone, bias towards bottom of list
5. Repeat 3,4 until loading complete
*/

    // retrieve first article to load
    var $readingListItem0 = $($readingListItems[0]);
    $readingListItem0.addClass('js-loading');
    retrieveReadingListItem($readingListItem0)
      .done(function (data) {
        // replace all the content in the reading list item, add loaded classes
        $readingListItem0.html(data);
        $readingListItem0.removeClass('js-loading');
        $readingListItem0.addClass('js-loaded');
      })
      .always(function () {
        // run events
        eventing();
      });

    $readingListItems.each(function () {

    });

  };

  /**
   * Prepare reading list for loading in content. Each reading list item will
   *  be kept at at least the height of the window so there's some buffer area
   *  for loading.
   */
  var prepare = function () {

    // // change height of loading cover to window height, ensure that it stays that way
    // var resizeReadingListItem = function () {
    //   $readingListLoadingCover.css('height', windowHeight + 'px');
    // };
    // $window.on('resize', resizeReadingListItem);
    // resizeReadingListItem();

    retrieveReadingListItemsInLoadingArea();

    // // we're done loading, turn off resize loading cover handler, hide it
    // $window.off('resize', resizeReadingListItem);
    // $readingListLoadingCover.addClass('hidden');

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

    // set up container
    prepare();

    // fire off initial eventing
    eventing();

    // bind other events
    $readingListContent.on('scroll', eventing);
    $window.on('resize', eventing);

    // do iscroll if we're on mobile
    if ($.browser.mobile) {
      // mobile browser, use IScroll
      (new IScroll(this[0], {
        useNativeScroll: true
      }));
    }

// TODO : put generalized mini-map functions here along with other default behaviors

    return this;
  };

})(jQuery, IScroll);
