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

var events = {
  atTop: 'reading-list-at-top',
  itemLoadStart: 'reading-list-item-load-start',
  itemLoadFinish: 'reading-list-item-load-done',
  itemLookingIn: 'reading-list-item-in-looking',
  itemLookingOut: 'reading-list-item-out-looking',
  itemProgress: 'reading-list-item-progress',
  outOfContent: 'reading-list-out-of-content',
  scrollToEventStart: 'reading-list-start-scroll-to',
  scrollToEventFinish: 'reading-list-end-scroll-to'
};
var eventsList = Object.keys(events).map(function (key) {
  return events[key];
});

var $window = $(window);
var $document = $(window.document);
var $body = $(window.document.body);

/**
 * ReadingList constructor.
 *
 * @param {(HTMLElement|jQuery|String)} element - object to pass into jQuery
 *    selector and to use for ReadingList container.
 * @returns {ReadingList}
 */
var ReadingList = function ($element, options) {

  this.$container = $element;

  this.settings = $.extend({
    addContent: false,
    dataRetrievalFail: function ($item) { return ''; },
    dataRetrievalSuccess: function ($item, data) { return data; },
    eventingThrottle: 10,
    loadingThreshold: 300,
    lookingThresholdBottom: 250,
    lookingThresholdTop: 200,
    miniMapActiveClass: 'reading-list-active',
    noEventBubbling: false,
    onPreSetup: null,
    onReady: null,
    scrollAnimationContainer: null,
    scrollContainerHeight: null,
    scrollToAddPx: 0,
    scrollToSpeed: 1000,
    scrollTotalHeight: null,
    selectorsItems: '.reading-list-item',
    selectorsItemsContainer: '.reading-list-items',
    selectorsItemsPreLoaded: '.reading-list-loaded',
    selectorsMiniMapItems: '.reading-list-mini-map-item'
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
  this.$activeItem = this.$listItems.length > 0 ? this.$listItems.eq(0) : null;
  this.$miniMapItems = $(this.settings.selectorsMiniMapItems);

  if (typeof(this.settings.onPreSetup) === 'function') {
    this.settings.onPreSetup(this);
  }

  this._setup();

  if (typeof(this.settings.onReady) === 'function') {
    this.settings.onReady(this);
  }

  return this;
};

/**
 * Setup function.
 *
 * @returns {undefined}
 */
ReadingList.prototype._setup = function () {

  // throttled eventing function to be used for all events
  this.eventing = _.throttle(this._unthrottledEventing, this.settings.eventingThrottle);

  // set up minimap item click
  this.$miniMapItems.on('click', this._miniMapItemClicked.bind(this));

  if (this.settings.noEventBubbling) {
    // don't bubble events up the dom tree, listeners must attach to the original container
    this.$container.on(
      eventsList.join(' '),
      function (e) {
        e.stopPropagation();
      });
  }

  this.$container.trigger(events.atTop);

  this._initialLoad();

  this.$container.on('scroll', this.eventing.bind(this));
  $window.on('resize', this.eventing.bind(this));

  this.ready = true;
};

/**
 * Initial item loading function to use when reading list is setup.
 *
 * @returns {undefined}
 */
ReadingList.prototype._initialLoad = function () {

  if (this.$listItems.length > 0) {
    var $firstLoad = $();
    var self = this;
    this.$listItems.each(function (i) {
      var $this = $(this);
      if ($firstLoad.length < 1 && $this.data('loadTo')) {
        $firstLoad = $this;
      }

      if ($this.filter(self.settings.selectorsItemsPreLoaded).length > 0) {
        self._doItemEvent(events.itemLoadFinish, $this, true);

        if (i === 0) {
          self.miniMapItemActivate($this);
          self._doItemEvent(events.itemLookingIn, $this, true);
          self._doItemEvent(events.itemProgress, $this, {progress: 0});
        }
      }
    });

    if ($firstLoad.length > 0) {
      this.retrieveListItemsTo($firstLoad);
    } else {
      // no first load specified, just load first item
      var $itemToLoad = this.$listItems.first();
      if (!$itemToLoad.data('loadStatus')) {
        this.retrieveListItem($itemToLoad);
      }
    }
  }
};

/**
 * Use an element's bounding box to determine if it's within an area defined
 *  by the top and bot boundaries. This is relative to the window!
 *
 * @param {HTMLElement} el - element being checked.
 * @param {Number} top - distance from the top of window to the top of the area
 *  to check if element is inside of.
 * @param {Number} bot - distance from top of window t the bottom of the area to
 *  check if the element is inside of.
 * @returns {Boolean} true if element is inside boundary, false otherwise.
 */
ReadingList.prototype._elementBoundingInsideArea = function (el, top, bot) {
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
 *  thresholds, which are calculated as distances from the window top. Uses
 *  lookingThresholdTop and lookingThresholdBottom to test.
 *
 * @param {HTMLElement} el - element to test.
 * @returns {Boolean} true if element is inside boundary, false otherwise.
 */
ReadingList.prototype.withinLookingArea = function (el) {
  var topThreshold = this.settings.lookingThresholdTop;
  var botThreshold = this.settings.lookingThresholdBottom;
  return this._elementBoundingInsideArea(el, topThreshold, botThreshold);
};

/**
 * Figure out what to use for scroll height calculations.
 *
 * @returns {Number} height of scroll container.
 */
ReadingList.prototype.getScrollContainerHeight = function () {
  return $.isFunction(this.settings.scrollContainerHeight) ?
    this.settings.scrollContainerHeight() :
    this.$container.height();
};

/**
 * Figure out what to use for scroll total height calculations.
 *
 * @returns {Number} scroll total height.
 */
ReadingList.prototype.getScrollTotalHeight = function () {
  return $.isFunction(this.settings.scrollTotalHeight) ?
    this.settings.scrollTotalHeight() :
    this.$container[0].scrollHeight;
};

/**
 * Figure out what the scroll animation container should be.
 *
 * @returns {Object} container to use for scrolling.
 */
ReadingList.prototype.getScrollAnimationContainer = function () {
  return (this.settings.scrollAnimationContainer || this.$container);
};

/**
 * Trigger an event on an item and track the number of times it's been called.
 *
 * @param {String} name - name of event to trigger.
 * @param {Object} $item - item that event should trigger for.
 * @param {Object} [kwargs] - arguments object to pass into trigger.
 * @param {Boolean} [countCalls] - true to increment trigger counter.
 * @returns {undefined}
 */
ReadingList.prototype._doItemEvent = function (name, $item, kwargs, countCalls) {
  var doCountCalls = typeof(kwargs) === 'boolean' ? kwargs : countCalls;
  var eventTracker = $item.data('eventTracker') || {};

  if (doCountCalls) {
    if (eventTracker.hasOwnProperty(name)) {
      eventTracker[name]++;
    } else {
      eventTracker[name] = 1;
    }

    $item.data('eventTracker', eventTracker);
  }

  this.$container.trigger(name, [
    $item,
    $.extend({
      callCount: eventTracker[name],
    }, kwargs)
  ]);
};

/**
 * Item event loop for use inside main eventing function.
 *
 * @param {Boolean} loadBot - set to true if next item down needs to load.
 * @returns {Number} count of loaded items.
 */
ReadingList.prototype._itemEventing = function (loadBot) {
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
      this._doItemEvent(
        events.itemLoadStart,
        $item,
        { direction: loadDirection.DOWN },
        true
      );
      this._startItemLoad($item);

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
        // new active item isn't old active item, do some notifications
        if (this.$activeItem) {
          this.$activeItem.removeClass('reading-list-in-looking');
          this.miniMapItemDeactivate(this.$activeItem);
          this._doItemEvent(events.itemLookingOut, this.$activeItem, true);
        }

        $item.addClass('reading-list-in-looking');
        this.miniMapItemActivate($item);
        this._doItemEvent(events.itemLookingIn, $item, true);
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
    this._doItemEvent(events.itemProgress, this.$activeItem, {progress: progress});
  }

  return loadedCounter;
};

/**
 * Scroll event function. Keeps track of $activeItem which is the item
 *  currently being "looked" at, fires off events related to reading list
 *  movement.
 *
 * This is the unthrottled version that shouldn't be used directly.
 *
 * @returns {undefined}
 */
ReadingList.prototype._unthrottledEventing = function () {

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
    this.$container.trigger(events.atTop);
  }

  // check bottom loading threshold
  //
  // iff x - z - y <= a then past loading threshold
  var loadBot = false;
  if (scrollTotalHeight - scrollTop - scrollContainerHeight <= this.settings.loadingThreshold) {
    // flag that we need to load something bot
    loadBot = true;
  }

  var itemsLoaded = this._itemEventing(loadBot);

  // check if we've run out of reading list content
  if (itemsLoaded === this.$listItems.length && loadBot) {
    this._addContent();
    this.$container.trigger(events.outOfContent);
  }
};

/**
 * GET an item from reading list.
 *
 * @param {jQuery} $readingListItem - item to retrieve.
 * @returns {Promise} resolves when the response comes back from the server and
 *  html is loaded into the page.
 */
ReadingList.prototype.retrieveListItem = function ($readingListItem) {

  $readingListItem.data('loadStatus', loadStatus.LOADING);
  $readingListItem.addClass('reading-list-loading');

  var html;
  var status;
  var self = this;
  return $.get($readingListItem.data('href'))
    .done(function (data) {
      html = self.settings.dataRetrievalSuccess($readingListItem, data);
      status = loadStatus.LOADED;

      $readingListItem.removeClass('reading-list-loading');
      $readingListItem.addClass('reading-list-loaded');
    })
    .fail(function () {
      html = self.settings.dataRetrievalFail($readingListItem);
      status = loadStatus.FAILED;

      $readingListItem.removeClass('reading-list-loading');
      $readingListItem.addClass('reading-list-load-failed');
    })
    .always(function () {
      $readingListItem.data('loadStatus', status);

      if (html) {
        $readingListItem.html(html);
      }

      self.eventing();
      self._doItemEvent(events.itemLoadFinish, $readingListItem, true);
    });
};

/**
 * Load up all the items on the way to given reading list item.
 *
 * @returns {Promise} resolves with the item scrolled to in a jQuery container
 *  when all items have been loaded up to given item.
 */
ReadingList.prototype.retrieveListItemsTo = function ($readingListItem) {

  var deferred = $.Deferred();
  // loop through reading list items and load everything up to and including
  //  given item
  var pos = this.$listItems.index($readingListItem) + 1;
  var loaded = 0;
  var completeCheck = function () {
    loaded++;
    if (pos === loaded && deferred.state() !== 'resolved') {
      // done loading, resolve
      deferred.resolve($readingListItem);
    }
  };

  var self = this;
  this.$listItems.each(function () {
    var $item = $(this);
    if (!$item.data('loadStatus')) {
      // hasn't been loaded yet, attempt to load it
      self.retrieveListItem($item).always(completeCheck);
    } else {
      // already loaded
      completeCheck();
    }
    if ($readingListItem.is($item)) {
      // found our item to stop loading at
      return false;
    }
  });

  // return promise that resolves when all items come back
  return deferred.promise();
};

/**
 * Check if item hasn't been loaded yet and then retrieve it if it hasn't.
 *
 * @param {jQuery} $item - item to start loading.
 * @returns {undefined}
 */
ReadingList.prototype._startItemLoad = function ($item) {
  if (!$item.data('loadStatus')) {
    // no attempt has ever been made to load this item, start loading it
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

  $item.data('loadStatus', loadStatus.LOADED);
  this.$listItems.add($item);
  this.$itemsContainer.append($item);
  this._doItemEvent(events.itemLoadFinish, $item, true);

  return $item;
};

/**
 * Adds content to end of reading list based on given addContent function.
 *
 * @returns {undefined}
 */
ReadingList.prototype._addContent = function () {
  if (this.settings.addContent) {
    this.settings.addContent()
      .done(this.appendItem.bind(this))
      .fail(function () {
        console.log('Add item function failed, content not added to reading list.');
      });
  }
};

/**
 * Stop animations being done on container.
 *
 * @returns {Object} animation interface.
 */
ReadingList.prototype.stopContainerAnimation = function () {
  return this.getScrollAnimationContainer().stop();
};

/**
 * Scroll to a given item. Reads settings scrollToAddPx to add additional pixels
 *  to scroll event, useful if a sticky header or something similar is positioned
 *  absolutely and may block scrolled-to content.
 *
 * @param {jQuery} $item - item to scroll to.
 * @returns {undefined}
 */
ReadingList.prototype.scrollToItem = function ($item) {
  var stopContainerAnimation = this.stopContainerAnimation.bind(this);

  var addPx = 0;
  if (typeof(this.settings.scrollToAddPx) === 'function') {
    addPx = this.settings.scrollToAddPx($item);
  } else if (typeof(this.settings.scrollToAddPx) === 'number') {
    addPx = this.settings.scrollToAddPx;
  }

  // ensure the animation stops when user interaction occurs
  $document.on(MOVEMENTS, stopContainerAnimation);

  this._doItemEvent(events.scrollToEventStart, $item);
  this.stopContainerAnimation().animate({
    scrollTop: $item.position().top + (addPx || 0)
  },
  this.settings.scrollToSpeed,
  (function () {
    // unbind the scroll stoppage
    $document.off(MOVEMENTS, stopContainerAnimation);
    this._doItemEvent(events.scrollToEventFinish, $item);
  }).bind(this));
};

/**
 * Event for clicks of minimap items.
 *
 * @param {Event} e - click event.
 * @returns {undefined}
 */
ReadingList.prototype._miniMapItemClicked = function (e) {
  var $miniMapItem = $(e.currentTarget);

  e.preventDefault();

  var itemRef = $miniMapItem.data('itemRef');

  // retrieve everything on the way to our item, then scroll to it
  var $item = this.$listItems.filter('#' + itemRef);
  this.retrieveListItemsTo($item)
    .always(this.scrollToItem.bind(this, $item));
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
 * @param {jQuery} $item - item to find minimap items for.
 * @returns {undefined}
 */
ReadingList.prototype.miniMapItemActivate = function ($item) {
  this.miniMapFindByItem($item).addClass(this.settings.miniMapActiveClass);
};

/**
 * Deactivate the minimap items associated with given item.
 *
 * @param {jQuery} $item - item to find minimap items for.
 * @returns {undefined}
 */
ReadingList.prototype.miniMapItemDeactivate = function ($item) {
  this.miniMapFindByItem($item).removeClass(this.settings.miniMapActiveClass);
};

/**
 * Utility to wrap a callback function. Improves testability by allowing
 *  stubbing of callbacks even after the object has been setup.
 *
 * Usage:
 *
 * `$element.on('some-event', readingList.callback(myReadingList, 'someCallbackFunction'));`
 *
 *  which can be stubbed later. As opposed to:
 *
 * `$element.on('some-event', myReadingList.someCallbackFunction.bind(myReadingList));`
 *
 *  which cannot be stubbed later.
 *
 * @param {Object} thisArg - Object to use for `this` inside callback.
 * @param {String} callbackName - name of function to use for callback. Must
 *  be a function and already be present on Object given for `thisArg`.
 * @returns {undefined}
 */
ReadingList.prototype.callback = function (thisArg, callbackName) {
  if (typeof thisArg[callbackName] !== 'function') {
    throw new Error('Listener callback must be a function!');
  }

  return function () {
    return thisArg[callbackName].apply(thisArg, arguments);
  };
};

/**
 * Wrapper to contain reading list logic inside a subobject of jquery element.
 *
 * @param {Object} options - options to pass to reading list.
 * @returns {jQuery} selected reading list element(s).
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

$.fn.readingList = createReadingList;

exports = ReadingList;

; browserify_shim__define__module__export__(typeof ReadingList != "undefined" ? ReadingList : window.ReadingList);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){

/**
 * Provide a visual way to debug reading list elements.
 */
!(function ($) {
  var $body = $(document.body);

  var $debugContainer = $('<div class="reading-list-debug-container">');
  $body.append($debugContainer);

  var $addDebugBar = function () {
    var $debugBar = $('<div class="reading-list-debug-bar">');

    $debugBar
      .css('background-color', 'grey')
      .css('bottom', 0)
      .css('position', 'fixed')
      .css('right', 0);

    $debugContainer.append($debugBar);
    return $debugBar;
  };

  var $addVisualRule = function (top, isAbsolute) {
    var $rule = $('<hr>');

    $rule
      .css('border-bottom', '1px solid red')
      .css('border-left', 'none')
      .css('border-right', 'none')
      .css('border-top', 'none')
      .css('bottom', 0)
      .css('margin', 0)
      .css('pointer-events', 'none')
      .css('position', isAbsolute ? 'absolute' : 'fixed')
      .css('right', 0)
      .css('top', top + 'px')
      .css('width', '100%');

    $debugContainer.append($rule);
    return $rule;
  };

  var setActiveItemIndicator = function (e, $item) {
    var $debugBar = $('.reading-list-debug-bar');

    if ($debugBar.length > 0) {
      var $activeItemIndicator = $debugBar.find('.reading-list-debug-active-item');

      if ($activeItemIndicator.length < 1) {
        $activeItemIndicator = $(
          '<div class="reading-list-debug-active-item">' +
            '<span>Active Item:</span>' +
            '<span class="reading-list-debug-active-item-text">UNSET</span>' +
          '</div>'
        );
        $debugBar.append($activeItemIndicator);
      }

      $activeItemIndicator
        .find('.reading-list-debug-active-item-text')
        .html(typeof($item) !== 'undefined' ? $item.attr('id') : 'undefined');
    }
  };

  var setItemDebug = function (e, $item) {
    $item
      .css('border-top', '1px solid blue')
      .css('border-bottom', '1px solid blue');
  };

  window.readingListDebug = {
    /**
     * Debug given reading list.
     *
     * @param {ReadingList} readingList - reading list to debug.
     */
    debug: function (readingList) {
      this.debugOff(readingList);

      $addDebugBar();
      $addVisualRule(readingList.settings.lookingThresholdTop);
      $addVisualRule(readingList.settings.lookingThresholdBottom);

      readingList.$container.on('reading-list-item-in-looking', setActiveItemIndicator);
      readingList.$container.on('reading-list-item-out-looking', setActiveItemIndicator);
      readingList.$container.on('reading-list-item-load-done', setItemDebug);

      setActiveItemIndicator(null, readingList.$activeItem);
      readingList.$listItems.each(function () {
        var $item = $(this);

        if ($item.data('loadStatus') === 'loaded') {
          setItemDebug(null, $item);
        }
      });

      return this;
    },
    debugOff: function (readingList) {
      $debugContainer.empty();

      readingList.$container.off('reading-list-item-in-looking', setActiveItemIndicator);
      readingList.$container.off('reading-list-item-out-looking', setActiveItemIndicator);
      readingList.$container.off('reading-list-item-load-done', setItemDebug);

      return this;
    }
  };

})(window.jQuery);

},{}]},{},[1,2]);
