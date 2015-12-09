
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

  this.settings = $.extend({
    loadingThreshold: 300,
    lookingThresholdTop: 200,
    lookingThresholdBottom: 250,
    eventingThrottle: 10,
    scrollToSpeed: 1000,
    selectorsMiniMapItems: '.reading-list-mini-map-item',
    selectorsItemsContainer: '.reading-list-items',
    selectorsItems: '.reading-list-item',
    addContent: false,
    dataRetrievalSuccess: function ($item, data) {
      return data;
    },
    dataRetrievalFail: function ($item) {
      return '';
    },
    scrollContainerHeight: null,
    scrollTotalHeight: null,
    scrollAnimationContainer: null,
    noEventBubbling: false,
    onReady: null
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
 *
 * @returns {undefined}
 */
ReadingList.prototype.setup = function () {

  // throttled eventing function to be used for all events
  this.eventing = _.throttle(this.unthrottledEventing, this.settings.eventingThrottle);

  // currently active item
  this.$activeItem = null;

  // set up minimap item click
  this.$miniMapItems.on('click', this.miniMapItemClicked.bind(this));

  if (this.settings.noEventBubbling) {
    // don't bubble events up the dom tree, listeners must attach to the original container
    this.$container.on(
      'reading-list-at-top ' +
      'reading-list-at-bottom ' +
      'reading-list-at-bottom-load-threshold ' +
      'reading-list-out-of-content ' +
      'reading-list-item-load-start ' +
      'reading-list-item-in-looking ' +
      'reading-list-item-out-looking ' +
      'reading-list-item-progress ' +
      'reading-list-item-load-done ' +
      'reading-list-start-scroll-to ' +
      'reading-list-end-scroll-to',
      function (e) {
        e.stopPropagation();
      });
  }

  this.$container.trigger('reading-list-at-top');

  // set up some default event callbacks
  this.$container.on('reading-list-item-load-start', this.startItemLoad.bind(this));
  this.$container.on('reading-list-item-in-looking', this.miniMapItemActivate.bind(this));
  this.$container.on('reading-list-item-out-looking', this.miniMapItemDeactivate.bind(this));
  if (this.settings.addContent) {
    this.$container.on('reading-list-out-of-content', this.addContent.bind(this));
  }

  this.initialLoad();

  this.$container.on('scroll', this.eventing.bind(this));
  $window.on('resize', this.eventing.bind(this));

  this.ready = true;

  if (this.settings.onReady) {
    this.settings.onReady(this);
  }
};

/**
 * Initial item loading function to use when reading list is setup.
 *
 * @returns {undefined}
 */
ReadingList.prototype.initialLoad = function () {

  if (this.$listItems.length > 0) {
    // check if some item in list has been marked with load-first, use to load
    var $firstLoad = this.$listItems.filter(function () {
      return $(this).data('loadTo');
    });

    if ($firstLoad.length > 0) {
      this.retrieveListItemsTo($firstLoad);
    } else {
      // no first load specified, just load first item
      $itemToLoad = this.$listItems.first();
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
ReadingList.prototype.elementBoundingInsideArea = function (el, top, bot) {
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
  return this.elementBoundingInsideArea(el, topThreshold, botThreshold);
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
ReadingList.prototype.doItemEvent = function (name, $item, kwargs, countCalls) {
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
ReadingList.prototype.itemEventing = function (loadBot) {
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
      this.doItemEvent(
        'reading-list-item-load-start',
        $item,
        { direction: loadDirection.DOWN },
        true
      );
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
          this.doItemEvent('reading-list-item-out-looking', this.$activeItem, true);
        }

        $item.addClass('reading-list-in-looking');
        this.doItemEvent('reading-list-item-in-looking', $item, true);
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
    this.doItemEvent('reading-list-item-progress', this.$activeItem, {progress: progress});
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
    this.$container.trigger('reading-list-out-of-content');
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
      self.doItemEvent('reading-list-item-load-done', $readingListItem, true);
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
 * @param {Event} e - not used.
 * @param {jQuery} $item - item to start loading.
 * @param {String} direction - not used.
 * @returns {undefined}
 */
ReadingList.prototype.startItemLoad = function (e, $item, direction) {
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
  this.doItemEvent('reading-list-item-load-done', $item, true);

  return $item;
};

/**
 * Adds content to end of reading list based on given addContent function.
 *
 * @returns {undefined}
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
 *
 * @returns {Object} animation interface.
 */
ReadingList.prototype.stopContainerAnimation = function () {
  return this.getScrollAnimationContainer().stop();
};

/**
 * Scroll to a given item.
 *
 * @param {jQuery} $item - item to scroll to.
 * @param {Number} addPx - additional number of pixels to scroll.
 * @returns {undefined}
 */
ReadingList.prototype.scrollToItem = function ($item, addPx) {
  var stopContainerAnimation = this.stopContainerAnimation.bind(this);

  // ensure the animation stops when user interaction occurs
  $document.on(MOVEMENTS, stopContainerAnimation);

  this.doItemEvent('reading-list-start-scroll-to', $item);
  this.stopContainerAnimation().animate({
    scrollTop: $item.position().top + (addPx || 0)
  },
  this.settings.scrollToSpeed,
  (function () {
    // unbind the scroll stoppage
    $document.off(MOVEMENTS, stopContainerAnimation);
    this.doItemEvent('reading-list-end-scroll-to', $item);
  }).bind(this));
};

/**
 * Event for clicks of minimap items.
 *
 * @param {Event} e - click event.
 * @returns {undefined}
 */
ReadingList.prototype.miniMapItemClicked = function (e) {
  var $miniMapItem = $(e.currentTarget);

  e.preventDefault();

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
 * @returns {undefined}
 */
ReadingList.prototype.miniMapItemActivate = function (e, $item) {
  this.miniMapFindByItem($item).addClass('reading-list-active');
};

/**
 * Deactivate the minimap items associated with given item.
 *
 * @param {Event} e - event that triggered this call.
 * @param {jQuery} $item - item to find minimap items for.
 * @returns {undefined}
 */
ReadingList.prototype.miniMapItemDeactivate = function (e, $item) {
  this.miniMapFindByItem($item).removeClass('reading-list-active');
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
