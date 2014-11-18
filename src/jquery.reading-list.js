(function ($, IScroll, _) {
  'use strict';

  var $window = $(window);
  var $document = $(window.document);

  var loadStatus = {
    NOT_ATTEMPTED: false,
    LOADED: 'loaded',
    FAILED: 'failed'
  };

  var loadDirection = {
    NONE: false,
    DOWN: 'down'
  };

  // reading list specific elements
  var $readingListContainer;
  var $readingListContent;
  var $readingListItemsContainer;
  var $readingListItems;
  var $readingListMiniMap;
  var $readingListMiniMapItems;

  // iscroll container for mobile
  var iscroll;

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
   *  movement. Debounced as many ms as defined in settings.
   */
  var $activeItem;
  var eventing = _.debounce(function () {
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

    // check bottom loading threshold
    var loadBot = false;
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
    var loadingBotCounter = 0;
    $readingListItems.each(function (i, item) {
      var $item = $(item);

      // check if this is below a loaded item and we're loading down
      if (!$item.data('load-status') &&
          loadingBotCounter < 1 && loadBot &&
          $item.prev().data('load-status') === loadStatus.LOADED) {
        // load something at the bottom
        $readingListContainer.trigger('reading-list-start-item-load',
          [$item, loadDirection.DOWN]);
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
  }, 100);

  /**
   * GET an item from reading list. Returns a promise that resolves when the
   *   response comes back from the server.
   */
  var retrieveReadingListItem = function ($readingListItem, successCallback,
      failCallback) {
    // wrap this response stuff so we don't have any problems with var reference
    return (function ($item, sCallback, fCallback) {
      var success = sCallback || settings.dataRetrievalSuccess;
      var failure = fCallback || settings.dataRetrievalFail;
      var href = $item.data('href');
      $item.addClass('loading');
      return $.get(href)
        .done(function (data) {
          // allow us to know if loading succeeded
          $item.data('load-status', loadStatus.LOADED);
          // replace all the content in the reading list item, add loaded classes
          var html = success($item, data);
          if (html) {
            $item.html(html);
          }
        })
        .fail(function () {
          // allow us to know if loading failed
          $item.data('load-status', loadStatus.FAILED);
          // loading failed, loaded to false to indicate loading attempted, failed
          var html = fCallback($item);
          if (html) {
            $item.html(html);
          }
        })
        .always(function () {
          // do eventing
          eventing();
          // event that tells us something is done loading
          $readingListContainer.trigger('reading-list-start-item-load-done',
            [$item]);
        });
    })($readingListItem, successCallback, failCallback);
  };

  /**
   * Start reading list jquery plugin construciton.
   */
  $.fn.readingList = function (options) {
    settings = $.extend({
      // height from the bottom of scrolling container to start loading
      loadingThreshold: 300,
      // top boundary of "looking" area, measured from top of window
      viewingThresholdTop: 200,
      // bottom boundary of "looking" area, measured from top of window
      viewingThresholdBottom: 250,
      // reading list data transform callback to change received data to html
      dataRetrievalSuccess: function ($item, data) {
        $item.removeClass('loading');
        $item.addClass('loaded');
        return data;
      },
      // reading list data failure callback, return html to replace item contents
      dataRetrievalFail: function ($item) {
        $item.addClass('load-failed');
        return '';
      }
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

    // set up event to load items
    $readingListContainer.on('reading-list-start-item-load',
      function (e, $item, direction) {
        // attempt to load this if loading hasn't been attempted before
        if (!$item.data('load-status')) {
          retrieveReadingListItem($item);
        }
      });

    // set up minimap events
    $readingListContainer.on('reading-list-item-in-looking',
      function (event, $item) {
        var id = $item.attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter(function () {
          return $(this).data('item-ref') === id;
        }).addClass('active');
      });
    $readingListContainer.on('reading-list-item-out-looking',
      function (event, $item) {
        var id = $item.attr('id');
        var $miniMapItem = $readingListMiniMapItems.filter(function () {
          return $(this).data('item-ref') === id;
        }).removeClass('active');
      });

    // check if some item in list has been marked with load-first, use to load
    var $firstLoad = $readingListItems.filter(function () {
      return $(this).data('load-to');
    });
    // use item marked as first load or use first item in list
    var $itemToLoad = $firstLoad.length > 0 ?
      $firstLoad : $($readingListItems[0]);
    // load this first item
    retrieveReadingListItem($itemToLoad);

    // bind other events
    $readingListContent.on('scroll', eventing);
    $window.on('resize', eventing);

    // do iscroll if we're on mobile
    if ($.browser.mobile) {
      iscroll = (new IScroll($readingListContent[0], {
        useNativeScroll: true
      }));
      $readingListContainer.on('reading-list-start-item-load-done',
        function ($item) {
          iscroll.refresh();
        });
    }

    return this;
  };

})(jQuery, IScroll, _);
