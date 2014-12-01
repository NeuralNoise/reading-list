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
      // debounce in ms for eventing, use larger values if considering slower browsers
      eventingDebounce: 10,
      // time in ms for scroll to event when scrolling to an article
      scrollToSpeed: 1000,
      // class names for different parts of reading list
      selectors: {
        miniMapItems: '.reading-list-mini-map-item',
        scrollContainer: '.reading-list-content',
        itemsContainer: '.reading-list-items',
        items: '.reading-list-item'
      },
      // define this content to add content to the end of the reading list when
      //  there are no more items to load. expected to return a promise that will
      //  resolve with the content to append to the end of the list.
      addContent: false,
      // reading list data transform callback to change received data to html
      dataRetrievalSuccess: function ($item, data) {
        return data;
      },
      // reading list data failure callback, return html to replace item contents
      dataRetrievalFail: function ($item) {
        return '';
      }
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
    var $readingListContainer = this;
    var $readingListContent =
      $readingListContainer.find(settings.selectors.scrollContainer);
    var $readingListItemsContainer =
      $readingListContent.find(settings.selectors.itemsContainer);
    if ($readingListContainer.length < 1) {
      // no reading list container
      console.error('No element available for reading list, reading list creation failed.');
      return $readingListContainer;
    } else if ($readingListContent.length < 1) {
      // no scroll container
      console.error('Missing scrolling container, reading list creation failed.');
      return $readingListContainer;
    } else if ($readingListItemsContainer.length < 1) {
      // no items container
      console.error('Items container not avilable, reading list creation failed.');
      return $readingListContainer;
    }

    // find other elements
    var $window = $(window);
    var $document = $(window.document);
    var $readingListItems =
      $readingListItemsContainer.find(settings.selectors.items);
    var $readingListMiniMapItems =
      $(settings.selectors.miniMapItems);

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
      var topThreshold = settings.lookingThresholdTop;
      var botThreshold = settings.lookingThresholdBottom;
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
      var loadedCounter = 0;
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
        } else if ($item.data('load-status')) {
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
      // check if we've run out of reading list content
      if (loadedCounter === $readingListItems.length && loadBot) {
        // everything is loaded, fire event
        $readingListContainer.trigger('reading-list-out-of-content');
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
        $readingListContainer.trigger('reading-list-item-progress',
          [$activeItem, progress]);
      }
    }, settings.eventingDebounce);

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
            $readingListContainer.trigger('reading-list-start-item-load-done',
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
      $readingListContainer.on('reading-list-start-item-load',
        function (e, $item, direction) {
          // attempt to load this if loading hasn't been attempted before
          if (!$item.data('load-status')) {
            retrieveListItem($item);
          }
        });

      if (settings.addContent) {
        // set up event for when reading list is out of content
        $readingListContainer.on('reading-list-out-of-content', function () {
          settings.addContent()
            .done(function (html) {
              var $item = $(html);
              // mark this new item as loaded
              $item.data('load-status', loadStatus.LOADED);
              // add this new item to the collection of reading list items
              $readingListItems.add($item);
              // finally, append item to reading list
              $readingListItemsContainer.append($item);
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
            $readingListContent.stop().animate(
              {
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
      // load this first item if it does not already have a load status
      if (!$itemToLoad.data('load-status')) {
        retrieveListItem($itemToLoad);
      }

      // bind other events
      $readingListContent.on('scroll', eventing);
      $window.on('resize', eventing);

      // do iscroll if we're on mobile
      if ($.browser.mobile) {
        var iscroll = (new IScroll($readingListContent[0], {
          useNativeScroll: true
        }));
        $readingListContainer.on('reading-list-start-item-load-done',
          function ($item) {
            iscroll.refresh();
          });
      }

    };

    // set this thing up and then return original reading list element
    setup();
    return $readingListContainer;
  };

})(jQuery, IScroll, _);
