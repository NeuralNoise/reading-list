(function ($, IScroll, _) {
  'use strict';

  /**
   * Start reading list jquery plugin construciton.
   */
  $.fn.readingList = function (options) {

    // settings defaults, then extend
    var settings = $.extend({
      // height from the bottom of scrolling container to start loading
      loadingThreshold: 300,
      // top boundary of "looking" area, measured from top of window
      lookingThresholdTop: 200,
      // bottom boundary of "looking" area, measured from top of window
      lookingThresholdBottom: 250,
      // throttle in ms for eventing, use larger values if considering slower browsers
      eventingThrottle: 10,
      // time in ms for scroll to event when scrolling to an article
      scrollToSpeed: 1000,
      // class names for different parts of reading list
      selectorsMiniMapItems: '.reading-list-mini-map-item',
      selectorsItemsContainer: '.reading-list-items',
      selectorsItems: '.reading-list-item',
      // define this function to add content to the end of the reading list when
      //  there are no more items to load. expected to return a promise that will
      //  resolve with the content to append to the end of the list.
      addContent: false,
      // a list of events that should cause iscroll to refresh. this is
      //  necessary whenever an event results in a change of the display of the
      //  reading list, such as showing/hiding the list. these events should
      //  trigger somewhere in the document.
      refreshIScrollOn: [],
      // reading list data transform callback to change received data to html
      dataRetrievalSuccess: function ($item, data) {
        return data;
      },
      // reading list data failure callback, return html to replace item contents
      dataRetrievalFail: function ($item) {
        return '';
      },
      // set this to use a custom value for scroll container height in calculations,
      //  should be a function that returns an integer which is the height of the
      //  container being scrolled. Needed in cases, like were reading list is
      //  entire document and the window should be used for height calculations
      //  vs. document height.
      scrollContainerHeight: null
    }, options);

    // some constants
    var MOVEMENTS =
      'scroll touchmove mousedown DOMMouseScroll mousewheel keyup resize';

    var loadStatus = {
      NOT_ATTEMPTED: false,
      LOADING: 'loading',
      LOADED: 'loaded',
      FAILED: 'failed'
    };

    var loadDirection = {
      NONE: false,
      DOWN: 'down'
    };

    // ensure reading list elements we need are available
    var $readingListContent = this;
    var $readingListItemsContainer =
      $readingListContent.find(settings.selectorsItemsContainer);
    if ($readingListContent.length < 1) {
      // no scroll container
      console.error('Missing scrolling container, reading list creation failed.');
      return $readingListContent;
    } else if ($readingListItemsContainer.length < 1) {
      // no items container
      console.error('Items container not avilable, reading list creation failed.');
      return $readingListContent;
    }

    // find other elements
    var $window = $(window);
    var $document = $(window.document);
    var $body = $(window.document.body);
    var $readingListItems =
      $readingListItemsContainer.find(settings.selectorsItems);
    var $readingListMiniMapItems =
      $(settings.selectorsMiniMapItems);

    /**
     * Use an element's bounding box to determine if it's within an area defined
     *  by the top and bot boundaries. This is relative to the window!
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
      var topThreshold = settings.lookingThresholdTop;
      var botThreshold = settings.lookingThresholdBottom;
      return elementBoundingInsideArea(el, topThreshold, botThreshold);
    };

    // figure out what to use for scroll height calculations
    var getScrollContainerHeight =
        $.isFunction(settings.scrollContainerHeight) ?
          settings.scrollContainerHeight :
          function () { return $readingListContent.height(); };

    /**
     * Scroll event function. Keeps track of $activeItem which is the item
     *  currently being "looked" at, fires off events related to reading list
     *  movement. Throttled as many ms as defined in settings.
     */
    var $activeItem;
    var eventing = _.throttle(function () {

      var scrollTop = $readingListContent.scrollTop();
      var scrollContainerHeight = getScrollContainerHeight();

      var itemsHeight = $readingListItemsContainer.height();

      // check min/max scroll
      if (scrollTop <= 0) {
        // we're at the top of the reading list
        $readingListContent.trigger('reading-list-at-top');
      }
      // do bot check separate since you can be at the top/bot simultaneously if
      //  one item deep and item is shorter than window
      if (scrollTop <= settings.loadingThreshold) {
        // we're at the bottom of the reading list
        $readingListContent.trigger('reading-list-at-bottom');
      }

      // check bottom loading threshold
      var loadBot = false;
      if (itemsHeight - scrollTop - scrollContainerHeight <= settings.loadingThreshold) {
        // we're in the bottom loading threshold
        $readingListContent.trigger('reading-list-at-bottom-load-threshold', $activeItem);
        // flag that we need to load something bot
        loadBot = true;
      }

      // do event checks on individual items
      var $nowActive;
      var loadingBotCounter = 0;
      var loadedCounter = 0;
      $readingListItems.each(function (i, item) {
        var $item = $(item);

        // check if this is below a loaded item and we're loading down
        if (!$item.data('load-status') &&
            loadingBotCounter < 1 && loadBot &&
            $item.prev().data('load-status') === loadStatus.LOADED) {
          // load something at the bottom
          $readingListContent.trigger('reading-list-start-item-load',
            [$item, loadDirection.DOWN]);
          loadingBotCounter++;
        } else if ($item.data('load-status') === loadStatus.LOADED) {
          // this item is loaded, count it
          loadedCounter++;
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
              $readingListContent.trigger('reading-list-item-out-looking',
                [$activeItem]);
            }
            // add looking class to active item, trigger event
            $item.addClass('in-looking');
            $readingListContent.trigger('reading-list-item-in-looking',
              [$item]);
          }
          $nowActive = $item;
        }
      });
      // check if we've run out of reading list content
      if (loadedCounter === $readingListItems.length && loadBot) {
        // everything is loaded, fire event
        $readingListContent.trigger('reading-list-out-of-content');
      }
      // found an active item, set it to the active item
      $activeItem = $nowActive;
      if ($activeItem && $activeItem.length > 0) {
        // fire an event with percentage of article viewed, from "looking" threshold
        //  bottom, ensure this is never over 1.0
        var bounding = $activeItem[0].getBoundingClientRect();
        var viewedDist = (-bounding.top + settings.lookingThresholdBottom) /
          bounding.height;
        var progress = viewedDist <= 1.0 ? viewedDist : 1.0;
        $readingListContent.trigger('reading-list-item-progress',
          [$activeItem, progress]);
      }
    }, settings.eventingThrottle);

    /**
     * GET an item from reading list. Returns a promise that resolves when the
     *   response comes back from the server and html is loaded in to the page.
     */
    var retrieveListItem = function ($readingListItem, successCallback,
        failCallback) {
      // wrap this response stuff so we don't have any problems with var reference
      return (function ($item, sCallback, fCallback) {
        // set up a load status so we know we're loading
        $item.data('load-status', loadStatus.LOADING);
        // set up vars we'll need
        var success = sCallback || settings.dataRetrievalSuccess;
        var failure = fCallback || settings.dataRetrievalFail;
        var href = $item.data('href');
        // indicate loading is occuring
        $item.addClass('loading');
        // do get request, return it as a promise
        var html;
        var status;
        return $.get(href)
          .done(function (data) {
            // get html from success callback, deal with it
            html = success($item, data);
            status = loadStatus.LOADED;
            $item.removeClass('loading');
            $item.addClass('loaded');
          })
          .fail(function () {
            // get html from failure callback, deal with it
            html = failure($item);
            status = loadStatus.FAILED;
            $item.addClass('load-failed');
          }).always(function () {
            $item.data('load-status', status);
            if (html) {
              // add html and resolve promise so we know html is for sure on page
              $item.html(html);
            }
            // do eventing
            eventing();
            // event that tells us something is done loading
            $readingListContent.trigger('reading-list-start-item-load-done',
              [$item]);
          });
      })($readingListItem, successCallback, failCallback);
    };

    /**
     * Load up all the items on the way to given reading list item.
     */
    var retrieveListItemsTo = function ($readingListItem) {
      // wrap this response stuff so we don't have any problems with var reference
      return (function ($readingListItem) {
        // keep promise to resolve once they all come back
        var deferred = $.Deferred();
        // loop through reading list items and load everything up to and
        //  including given item
        var pos = $readingListItems.index($readingListItem) + 1;
        var loaded = 0;
        var completeCheck = function () {
          loaded++;
          if (pos === loaded &&
              deferred.state() !== 'resolved') {
            // we're done loading,resolve our promise
            deferred.resolve($readingListItem);
          }
        };
        $readingListItems.each(function () {
          var $item = $(this);
          // start loading item
          if (!$item.data('load-status')) {
            // hasn't been loaded yet, attempt to load it
            retrieveListItem($item).always(completeCheck);
          } else {
            // already loaded
            completeCheck();
          }
          // check if we have our item that we want to stop at
          if ($readingListItem.is($item)) {
            // found our item, stop loadings
            return false;
          }
        });
        // return promise that resolves when all items come back
        return deferred.promise();
      })($readingListItem);
    };

    /**
     * Setup function for plugin.
     */
    var setup = function () {
      // set up event to load items
      $readingListContent.on('reading-list-start-item-load',
        function (e, $item, direction) {
          // attempt to load this if loading hasn't been attempted before
          if (!$item.data('load-status')) {
            retrieveListItem($item);
          }
        });

      if (settings.addContent) {

        // placeholder for readinglist stuff accessible outside plugin
        $readingListContent.readingList = {};

        // set up event for when reading list is out of content
        $readingListContent.on('reading-list-out-of-content', function () {
          settings.addContent()
            .done(function (html) {
              var $item = $(html);
              // mark this new item as loaded
              $item.data('load-status', loadStatus.LOADED);
              // add this new item to the collection of reading list items
              $readingListItems.add($item);
              // finally, append item to reading list
              $readingListItemsContainer.append($item);
              // let others know a new item has loaded
              $readingListContent.trigger('reading-list-start-item-load-done',
                [$item]);
            })
            .fail(function () {
              console.log('Add item function failed, content not added to reading list.');
            });
        });
      }

      // set up minimap items
      $readingListMiniMapItems.on('click', function (e) {
        var $this = $(this);
        // ensure our click event doesn't go through to the anchor
        e.preventDefault();
        // find the item to scroll to
        var itemRef = $this.data('item-ref');

        var $item = $readingListItems.filter('#' + itemRef);
        // retrieve everything on the way to our item, then scroll to it
        retrieveListItemsTo($item).always(function ($readingListItem) {
            var stop = function () {
              $readingListContent.stop();
            };
            // ensure we can stop the animation if we want
            $document.on(MOVEMENTS, stop);

            // stop any running animations and begin a new one
            $readingListContent.stop().animate({
              scrollTop: $readingListItem.position().top
            },
            settings.scrollToSpeed,
            function () {
              // unbind the scroll stoppage
              $document.off(MOVEMENTS, stop);
            });
        });
      });

      // set up minimap events
      $readingListContent.on('reading-list-item-in-looking',
        function (event, $item) {
          var id = $item.attr('id');
          $readingListMiniMapItems.filter(function () {
            return $(this).data('item-ref') === id;
          }).addClass('active');
        });
      $readingListContent.on('reading-list-item-out-looking',
        function (event, $item) {
          var id = $item.attr('id');
          $readingListMiniMapItems.filter(function () {
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
      // load this first item if it does not already have a load status
      if (!$itemToLoad.data('load-status')) {
        retrieveListItem($itemToLoad);
      }

      $readingListContent.on('scroll', eventing);

      $window.on('resize', eventing);

      // do iscroll if we're on mobile
      if ($.browser.mobile) {
        var iscroll = (new IScroll($readingListContent[0], {
          useNativeScroll: true
        }));
        var refreshDisp = function () {
          iscroll.refresh();
        };
        // refresh iscroll whenever something is done loading in to list
        $readingListContent.on('reading-list-start-item-load-done', refreshDisp);
        if (settings.refreshIScrollOn) {
          // loop through iscroll refresh events and bind refresher
          for (var i = 0; i < settings.refreshIScrollOn.length; i++) {
            $document.on(settings.refreshIScrollOn[i], refreshDisp);
          }
        }
      }

    };

    // set this thing up and then return original reading list element
    setup();
    return $readingListContent;
  };

})(jQuery, IScroll, _);
