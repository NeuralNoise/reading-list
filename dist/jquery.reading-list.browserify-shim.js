(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
; var __browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {

// some constants
var MOVEMENTS =
  'touchmove mousedown DOMMouseScroll mousewheel keyup resize';

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

var $window = $(window);
var $document = $(window.document);
var $body = $(window.document.body);

var ReadingList = function ($element, options) {

  this.$container = $element;

  // settings defaults, then extend
  this.settings = $.extend({
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
    scrollContainerHeight: null,
    // set this to use a custom value for scroll total height in calculations. Should
    //   be a function that returns an integer which is the total scrollable height
    //   of the scroll container. Needed in cases such as when the reading list is
    //   entire document and the body should be used for scroll total height calculations.
    scrollTotalHeight: null,
    // set this to use a custom container for scrolling animation. A jQuery object
    //  that encapsulates the element that scrolling will occur on. Needed in cases
    //  such as when the reading list is entire document and the body should be used
    //  for scroll animations.
    scrollAnimationContainer: null
  }, options);

  // ensure reading list elements we need are available, fail otherwise
  this.$itemsContainer = this.$container.find(this.settings.selectorsItemsContainer);
  if (this.$container.length < 1) {
    // no scroll container
    throw new Error('Missing scrolling container, reading list creation failed.');
  } else if (this.$itemsContainer.length < 1) {
    // no items container
    throw new Error('Items container not available, reading list creation failed.');
  }

  // elements needed for reading list
  this.$listItems = this.$container.find(this.settings.selectorsItems);
  this.$miniMapItems = $(this.settings.selectorsMiniMapItems);

  this.setup();
};

/**
 * Setup function.
 */
ReadingList.prototype.setup = function () {

  // throttled eventing function to be used for all events
  this.eventing = _.throttle(this.unthrottledEventing, this.settings.eventingThrottle);

  // currently active item
  this.$activeItem = null;

  // set up minimap item click
  this.$miniMapItems.on('click', this.miniMapItemClicked.bind(this));

  // set up some default events
  this.$container.on('reading-list-start-item-load', this.startItemLoad.bind(this));
  this.$container.on('reading-list-item-in-looking', this.miniMapItemActivate.bind(this));
  this.$container.on('reading-list-item-out-looking', this.miniMapItemDeactivate.bind(this));
  if (this.settings.addContent) {
    // set up event for when reading list is out of content
    this.$container.on('reading-list-out-of-content', this.addContent.bind(this));
  }

  // do initial load
  this.initialLoad();

  // events to do this logic on
  this.$container.on('scroll', this.eventing.bind(this));
  $window.on('resize', this.eventing.bind(this));

  // do iscroll if we're on mobile
  if ($.browser.mobile) {
    this.setupIScroll();
  }

  // put up a flag once we're done setting up
  this.ready = true;

  // braodcast that setup is done
  this.$container.trigger('reading-list-ready');
};

/**
 * Initial item loading function to use when reading list is setup.
 */
ReadingList.prototype.initialLoad = function () {
  // check if some item in list has been marked with load-first, use to load
  var $firstLoad = this.$listItems.filter(function () {
    return $(this).data('loadTo');
  });

  if ($firstLoad.length > 0) {
    // found an item to load first, retrieve everything up to that point
    this.retrieveListItemsTo($firstLoad);
  } else {
    // no first load specified, just load first item
    $itemToLoad = $(this.$listItems[0]);
    if (!$itemToLoad.data('loadStatus')) {
      this.retrieveListItem($itemToLoad);
    }
  }
};

/**
 * Using iScroll for reading list.
 */
ReadingList.prototype.setupIScroll = function () {
  this.iscrollRef = new IScroll(this.$container[0], { useNativeScroll: true });

  var refreshDisp = (function () {
    this.iscrollRef.refresh();
  }).bind(this);

  // refresh iscroll whenever something is done loading in to list
  this.$container.on('reading-list-start-item-load-done', refreshDisp);
  if (this.settings.refreshIScrollOn) {
    // loop through iscroll refresh events and bind refresher
    var i;
    for (i = 0; i < this.settings.refreshIScrollOn.length; i++) {
      $document.on(this.settings.refreshIScrollOn[i], refreshDisp);
    }
  }
};

/**
 * Use an element's bounding box to determine if it's within an area defined
 *  by the top and bot boundaries. This is relative to the window!
 */
ReadingList.prototype.elementBoundingInsideArea = function (el, top, bot) {
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
ReadingList.prototype.withinLookingArea = function (el) {
  // check if element is inside threshold
  var topThreshold = this.settings.lookingThresholdTop;
  var botThreshold = this.settings.lookingThresholdBottom;
  return this.elementBoundingInsideArea(el, topThreshold, botThreshold);
};

/**
 * Figure out what to use for scroll height calculations
 */
ReadingList.prototype.getScrollContainerHeight = function () {
  return $.isFunction(this.settings.scrollContainerHeight) ?
    this.settings.scrollContainerHeight() :
    this.$container.height();
};

/**
 * Figure out what to use for scroll total height calculations.
 */
ReadingList.prototype.getScrollTotalHeight = function () {
  return $.isFunction(this.settings.scrollTotalHeight) ?
    this.settings.scrollTotalHeight() :
    this.$container[0].scrollHeight;
};

/**
 * Item event loop for use inside main eventing function.
 *
 * @param {Boolean} loadBot - set to true if next item down needs to load.
 * @returns {Number} count of loaded items.
 */
ReadingList.prototype.itemEventing = function (loadBot) {
  // do event checks on individual items
  var $nowActive;
  var loadingBotCounter = 0;
  var loadedCounter = 0;
  // maximum number of items to load down at a time
  var loadingBotMax = 1;
  this.$listItems.each((function (i, item) {
    var $item = $(item);

    // check if this is below a loaded item and we're loading down, check the
    // previous item so that everything always loads in order
    if (!$item.data('loadStatus') &&
        loadingBotCounter < loadingBotMax && loadBot &&
        $item.prev().data('loadStatus') === loadStatus.LOADED) {
      // fire event telling loading to start
      this.$container.trigger('reading-list-start-item-load', [$item, loadDirection.DOWN]);
      // this item is going to be loading, count it
      loadingBotCounter++;
    } else if ($item.data('loadStatus') === loadStatus.LOADED) {
      // this item is already loaded, count it
      loadedCounter++;
    }

    // if nothing is active yet, check if it's in the viewing area, this effectively
    //  means that items higher up in the list take priority of being visible, e.g.
    //  given two reading list items in the viewing area, the top one will be marked
    //  as currently being read
    if (!$nowActive && this.withinLookingArea($item[0])) {

      // in looking area, and we haven't assigned a now active item yet
      if (!$item.is(this.$activeItem)) {
        // this is not the currently active item, so we'll want to fire off
        //  events to indicate the change
        if (this.$activeItem) {
          // previously active item gets an event for no longer being active
          this.$activeItem.removeClass('reading-list-in-looking');
          this.$container.trigger('reading-list-item-out-looking', [this.$activeItem]);
        }

        // add looking class to active item, trigger event
        $item.addClass('reading-list-in-looking');
        this.$container.trigger('reading-list-item-in-looking', [$item]);
      }

      // set the now active item to this item
      $nowActive = $item;
    }
  }).bind(this));

  // check if there's an active item, fire progress events if so
  this.$activeItem = $nowActive;
  if (this.$activeItem && this.$activeItem.length > 0) {
    // fire an event with percentage of article viewed
    //
    // given:
    //  t = bounding.top            -> top of item relative to viewport, t < 0 in cases we care about
    //  x = lookingThresholdBottom  -> dist from top of window to bottom of looking area
    //  h = bounding.height         -> total rendered height of item
    //
    // p = (-t + x) / h = ratio viewed, max(p) = 1.0
    var bounding = this.$activeItem[0].getBoundingClientRect();
    var ratioViewed = (-bounding.top + this.settings.lookingThresholdBottom) /
      bounding.height;
    var progress = ratioViewed <= 1.0 ? ratioViewed : 1.0;
    this.$container.trigger('reading-list-item-progress', [this.$activeItem, progress]);
  }

  return loadedCounter;
};

/**
 * Scroll event function. Keeps track of $activeItem which is the item
 *  currently being "looked" at, fires off events related to reading list
 *  movement.
 *
 * This is the unthrottled version that shouldn't be used directly.
 */
ReadingList.prototype.unthrottledEventing = function () {

  // given:
  //  x = scrollTotalHeight      -> entire height of scrollable area
  //  y = scrollContainerHeight  -> visible height of scrollable area
  //  z = scrollTop              -> current scroll location relative to total scrollable height
  //  a = loadingThreshold       -> distance from bottom of scrollable area to begin loading
  var scrollTop = this.$container.scrollTop();
  var scrollContainerHeight = this.getScrollContainerHeight();
  var scrollTotalHeight = this.getScrollTotalHeight();

  // check min/max scroll
  if (scrollTop <= 0) {
    // we're at the top of the reading list
    this.$container.trigger('reading-list-at-top');
  }

  // do bot check separate since you can be at the top/bot simultaneously if
  //  one item deep and item is shorter than window
  //
  // iff x <= z + y then bottom of reading list
  if (scrollTotalHeight <= scrollTop + scrollContainerHeight) {
    // we're at the bottom of the reading list
    this.$container.trigger('reading-list-at-bottom');
  }

  // check bottom loading threshold
  //
  // iff x - z - y <= a then past loading threshold
  var loadBot = false;
  if (scrollTotalHeight - scrollTop - scrollContainerHeight <= this.settings.loadingThreshold) {
    // we're in the bottom loading threshold
    this.$container.trigger('reading-list-at-bottom-load-threshold');
    // flag that we need to load something bot
    loadBot = true;
  }

  var itemsLoaded = this.itemEventing(loadBot);

  // check if we've run out of reading list content
  if (itemsLoaded === this.$listItems.length && loadBot) {
    // everything is loaded, fire event
    this.$container.trigger('reading-list-out-of-content');
  }
};

/**
 * GET an item from reading list. Returns a promise that resolves when the
 *   response comes back from the server and html is loaded in to the page.
 */
ReadingList.prototype.retrieveListItem = function ($readingListItem) {

  // set up a load status so we know we're loading
  $readingListItem.data('loadStatus', loadStatus.LOADING);

  // indicate loading is occuring
  $readingListItem.addClass('reading-list-loading');

  // do get request, return it as a promise
  var html;
  var status;
  var self = this;
  return $.get($readingListItem.data('href'))
    .done(function (data) {
      // get html from success callback, deal with it
      html = self.settings.dataRetrievalSuccess($readingListItem, data);
      status = loadStatus.LOADED;
      $readingListItem.removeClass('reading-list-loading');
      $readingListItem.addClass('reading-list-loaded');
    })
    .fail(function () {
      // get html from failure callback, deal with it
      html = self.settings.dataRetrievalFail($readingListItem);
      status = loadStatus.FAILED;
      $readingListItem.removeClass('reading-list-loading');
      $readingListItem.addClass('reading-list-load-failed');
    })
    .always(function () {
      // set load status depending on response
      $readingListItem.data('loadStatus', status);

      // set html if any was provided
      if (html) {
        // add html and resolve promise so we know html is for sure on page
        $readingListItem.html(html);
      }

      // do eventing
      self.eventing();
      // event that tells us something is done loading
      self.$container.trigger('reading-list-start-item-load-done', [$readingListItem]);
    });
};

/**
 * Load up all the items on the way to given reading list item.
 *
 * @returns {Promise} resolves with the item scrolled to in a jQuery container.
 */
ReadingList.prototype.retrieveListItemsTo = function ($readingListItem) {
  // keep promise to resolve once they all come back
  var deferred = $.Deferred();
  // loop through reading list items and load everything up to and
  //  including given item
  var pos = this.$listItems.index($readingListItem) + 1;
  var loaded = 0;
  var completeCheck = function () {
    loaded++;
    if (pos === loaded &&
        deferred.state() !== 'resolved') {
      // we're done loading,resolve our promise
      deferred.resolve($readingListItem);
    }
  };

  var self = this;
  this.$listItems.each(function () {
    var $item = $(this);
    // start loading item
    if (!$item.data('loadStatus')) {
      // hasn't been loaded yet, attempt to load it
      self.retrieveListItem($item).always(completeCheck);
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
};

/**
 * Check if item hasn't been loaded yet and then retrieve it if it hasn't.
 */
ReadingList.prototype.startItemLoad = function (e, $item, direction) {
  // attempt to load this if loading hasn't been attempted before
  if (!$item.data('loadStatus')) {
    this.retrieveListItem($item);
  }
};

/**
 * Add an item with given HTML to reading list.
 *
 * @param {String} html - html of item to append to reading list.
 * @returns {Object} newly added item wrapped in a jQuery object.
 */
ReadingList.prototype.appendItem = function (html) {
  var $item = $(html);
  // mark this new item as loaded
  $item.data('loadStatus', loadStatus.LOADED);
  // add this new item to the collection of reading list items
  this.$listItems.add($item);
  // finally, append item to reading list
  this.$itemsContainer.append($item);
  // let others know a new item has loaded
  this.$container.trigger('reading-list-start-item-load-done', [$item]);

  return $item;
};

/**
 * Adds content to end of reading list based on given addContent function.
 */
ReadingList.prototype.addContent = function () {
  this.settings.addContent()
    .done(this.appendItem.bind(this))
    .fail(function () {
      console.log('Add item function failed, content not added to reading list.');
    });
};

/**
 * Stop animations being done on container.
 */
ReadingList.prototype.stopContainerAnimation = function () {
  return (this.settings.scrollAnimationContainer || this.$container).stop();
};

/**
 * Scroll to a given item.
 *
 * @param {jQuery} $item - item to scroll to.
 */
ReadingList.prototype.scrollToItem = function ($item) {

  // ensure the animation stops when user interaction occurs
  $document.on(MOVEMENTS, this.stopContainerAnimation.bind(this));

  // stop any running animations and begin a new one
  this.stopContainerAnimation().animate({
    scrollTop: $item.position().top
  },
  this.settings.scrollToSpeed,
  (function () {
    // unbind the scroll stoppage
    $document.off(MOVEMENTS, this.stopContainerAnimation.bind(this));
  }).bind(this));
};

/**
 * Event for clicks of minimap items.
 */
ReadingList.prototype.miniMapItemClicked = function (e) {
  var $miniMapItem = $(e.currentTarget);
  // ensure our click event doesn't go through to the anchor
  e.preventDefault();
  // find the item to scroll to
  var itemRef = $miniMapItem.data('itemRef');

  // retrieve everything on the way to our item, then scroll to it
  var $item = this.$listItems.filter('#' + itemRef);
  this.retrieveListItemsTo($item)
    .always(this.scrollToItem.bind(this));
};

/**
 * Given a reading list item, find the corresponding minimap item(s).
 *
 * @param {jQuery} item to find minimap items for.
 * @returns {jQuery} minimap items that reference given item.
 */
ReadingList.prototype.miniMapFindByItem = function ($item) {
  var id = $item.attr('id');
  return this.$miniMapItems.filter(function () {
    return $(this).data('itemRef') === id;
  });
};

/**
 * Activate the minimap items associated with given item.
 *
 * @param {Event} e - event that triggered this call.
 * @param {jQuery} $item - item to find minimap items for.
 */
ReadingList.prototype.miniMapItemActivate = function (e, $item) {
  this.miniMapFindByItem($item).addClass('reading-list-active');
};

/**
 * Deactivate the minimap items associated with given item.
 *
 * @param {Event} e - event that triggered this call.
 * @param {jQuery} $item - item to find minimap items for.
 */
ReadingList.prototype.miniMapItemDeactivate = function (e, $item) {
  this.miniMapFindByItem($item).removeClass('reading-list-active');
};

/**
 * Wrapper to contain reading list logic inside a subobject of jquery element.
 */
var createReadingList = function (options) {
  // note: 'this' refers to the jquery object wrapping the reading list element
  this.each(function () {
    var $this = $(this);
    // wrapper to ensure we don't ever build another reading list over this one
    if (!$this.data('pluginReadingList')) {
      // plugin not initialized yet, build it and set it on data
      $this.data('pluginReadingList', new ReadingList($this, options));
    }
  });

  return this;
};

// attach this as a jquery plugin
$.fn.readingList = createReadingList;

// expose reading list functions
exports = ReadingList;

; browserify_shim__define__module__export__(typeof ReadingList != "undefined" ? ReadingList : window.ReadingList);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
