(function ($, IScroll) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var loadStatus = {
    NOT_ATTEMPTED: false,
    LOADED: 'loaded',
    FAILED: 'failed'
  };

  // reading list specific elements
  var $readingListContainer;
  var $readingListContent;
  var $readingListItemsContainer;
  var $readingListItems;
  var $readingListMiniMap;
  var $readingListMiniMapItems;

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
  var elementBoundingInsideArea = function (el, top, bot) {
    // check if element bounding box is within area
    var elBounding = el.getBoundingClientRect();
    var overTop = elBounding.top < top && elBounding.bottom < top;
    var belowBot = elBounding.top > bot && elBounding.bottom > bot;

    // if the whole thing is not over the top, or the whole thing is not below
    //  the bot some part of it must be in the area
    return !(overTop || belowBot);
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
    return elementBoundingInsideArea(el, topThreshold, botThreshold);
  };

  /**
   * Scroll event function. Keeps track of $activeItem which is the item
   *  currently being "looked" at, fires off events related to reading list
   *  movement.
   */
  var $activeItem;
  var eventing = function () {
    var scrollTop = $readingListContent.scrollTop();
    var itemsBounding = $readingListItemsContainer[0].getBoundingClientRect();

    // check min/max scroll
    if (scrollTop <= 0) {
      // we're at the top of the reading list
      $readingListContainer.trigger('reading-list-at-top');
    }
    // do bot check separate since you can be at the top/bot simultaneously if
    //  one item deep and item is shorter than window
    if (scrollTop + windowHeight >= $readingListItemsContainer.height() ||
        itemsBounding.bottom < windowHeight) {
      // we're at the bottom of the reading list, or bot is above window bot
      $readingListContainer.trigger('reading-list-at-bottom');
    }

    // check loading threshold
    var loadTop = false;
    var loadBot = false;
    if (scrollTop <= settings.loadingThreshold) {
      // we're in the top loading threshold of the reading list
      $readingListContainer.trigger('reading-list-at-top-load-threshold');
      // flag that we need to load something on top
      loadTop = true;
    }
    // do bot check separate since you can be at the top/bot simultaneously if
    //  one item deep and item is shorter than window
    if (scrollTop + windowHeight >=
        $readingListItemsContainer.height() - settings.loadingThreshold ||
        itemsBounding.bottom - settings.loadingThreshold < windowHeight) {
      // we're in the bottom loading threshold of the reading list, or bot is
      //  above threshold
      $readingListContainer.trigger('reading-list-at-bottom-load-threshold');
      // flag that we need to load something bot
      loadBot = true;
    }

    // do event checks on individual items
    var $nowActive;
    var loadingTopCounter = 0;
    var loadingBotCounter = 0;
    $readingListItems.each(function (i, item) {
      var $item = $(item);

      // check if this is above a loaded item, and we're loading up
      if (!$item.data('load-status') &&
          loadingTopCounter < settings.itemsToLoad && loadTop &&
          $item.next().data('load-status') === loadStatus.LOADED) {
        // load something at the top
        $readingListContainer.trigger('reading-list-start-item-load', [$item]);
        loadingTopCounter++;
      }
      // check if this is below a loaded item and we're loading down
      if (!$item.data('load-status') &&
          loadingBotCounter < settings.itemsToLoad && loadBot &&
          $item.prev().data('load-status') === loadStatus.LOADED) {
        // load something at the bottom
        $readingListContainer.trigger('reading-list-start-item-load', [$item]);
        loadingBotCounter++;
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
            $activeItem.removeClass('in-looking');
            $readingListContainer.trigger('reading-list-item-out-looking',
              [$activeItem]);
          }
          // add looking class to active item, trigger event
          $item.addClass('in-looking');
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
    $readingListItem.addClass('loading');
    return $.get(href)
      .done(function (data) {
        // replace all the content in the reading list item, add loaded classes
        $readingListItem.html(data);
        $readingListItem.removeClass('loading');
        $readingListItem.addClass('loaded');
        $readingListItem.data('load-status', loadStatus.LOADED);
      })
      .fail(function () {
        // loading failed, loaded to false to indicate loading attempted, failed
        $readingListItem.addClass('load-failed');
        $readingListItem.data('load-status', loadStatus.FAILED);
      })
      .always(function () {
        // run events
        eventing();
      });
  };

  $.fn.readingList = function (options) {
    settings = $.extend({
      // number of items to load simultaneously at the top/bottom when user is
      //  within the loading threshold
      itemsToLoad: 1,
      // height from the top and bottom of scrolling container to start loading
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
    $readingListMiniMap = $readingListContainer.find('.reading-list-mini-map');
    $readingListMiniMapItems = $readingListMiniMap
      .find('.reading-list-mini-map-item');

// TODO : check if there's an item in the url, if so, use that as first item to load
    // load first article
    var $readingListItem0 = $($readingListItems[0]);
    retrieveReadingListItem($readingListItem0);

    // set up event to load items
    $readingListContainer.on('reading-list-start-item-load',
      function (e, $item) {
        // attempt to load this if loading hasn't been attempted before
        if (!$item.data('load-status')) {
          retrieveReadingListItem($item);
        }
      });

    // set up minimap events
    $readingListContainer.on('reading-list-item-in-looking',
      function (event, $item) {
        var id = $item.children().first().attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter(function () {
          return $(this).data('item-ref') === id;
        }).addClass('active');
      });
    $readingListContainer.on('reading-list-item-out-looking',
      function (event, $item) {
        var id = $item.children().first().attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter(function () {
          return $(this).data('item-ref') === id;
        }).removeClass('active');
      });

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
