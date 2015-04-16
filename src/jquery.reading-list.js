
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
    scrollContainerHeight: null
  }, options);

  this.setup();
};

/**
 * Setup function.
 */
ReadingList.prototype.setup = function () {
  // ensure reading list elements we need are available, fail otherwise
  this.$itemsContainer = this.$container.find(this.settings.selectorsItemsContainer);
  if (this.$container.length < 1) {
    // no scroll container
    throw new Error('Missing scrolling container, reading list creation failed.');
  } else if (this.$itemsContainer.length < 1) {
    // no items container
    throw new Error('Items container not available, reading list creation failed.');
  }

  // throttled eventing function to be used for all events
  this.eventing = _.throttle(this.unthrottledEventing, this.settings.eventingThrottle);

  // currently active item
  this.$activeItem = null;

  // elements needed for reading list
  this.$listItems = this.$container.find(this.settings.selectorsItems);
  this.$miniMapItems = $(this.settings.selectorsMiniMapItems);

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
  var iscroll = new IScroll(this.$container[0], { useNativeScroll: true });

  var refreshDisp = function () {
    iscroll.refresh();
  };

  // refresh iscroll whenever something is done loading in to list
  this.$container.on('reading-list-start-item-load-done', refreshDisp);
  if (this.settings.refreshIScrollOn) {
    // loop through iscroll refresh events and bind refresher
    var i;
    for (i = 0; i < this.settings.refreshIScrollOn.length; i++) {
      $document.on(this.settings.refreshIScrollOn[i], refreshDisp);
    }
  }

  this.iscrollRef = iscroll;
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
 * Eventing for indiviaul items.
 */
ReadingList.prototype.itemEventing = function (i, $item, itemAlreadyActive, loadBot,
    loadingBotCounter, loadedCounter) {

  var isNowActive = false;

  // check if this is below a loaded item and we're loading down
  if (!$item.data('loadStatus') &&
      loadingBotCounter < 1 && loadBot &&
      $item.prev().data('loadStatus') === loadStatus.LOADED) {
    // load something at the bottom
    this.$container.trigger('reading-list-start-item-load', [$item, loadDirection.DOWN]);
    loadingBotCounter++;
  } else if ($item.data('loadStatus') === loadStatus.LOADED) {
    // this item is loaded, count it
    loadedCounter++;
  }

  // mark the higher up item in the looking area as the one being looked at
  if (!itemAlreadyActive) {
    var inLooking = this.withinLookingArea($item[0]);
    if(inLooking) {
      // in looking area, and we haven't assigned a now active item yet
      if (!$item.is(this.$activeItem)) {
        // this is not the currently active item, so we'll want to fire off
        //  events and things
        if (this.$activeItem) {
          // new item in looking area, set it to the active item
          this.$activeItem.removeClass('in-looking');
          this.$container.trigger('reading-list-item-out-looking', [this.$activeItem]);
        }
        // add looking class to active item, trigger event
        $item.addClass('in-looking');
        this.$container.trigger('reading-list-item-in-looking', [$item]);
      }

      isNowActive = true;
    }
  }

  return isNowActive;
};

/**
 * Scroll event function. Keeps track of $activeItem which is the item
 *  currently being "looked" at, fires off events related to reading list
 *  movement. Throttled as many ms as defined in settings.
 */
ReadingList.prototype.unthrottledEventing = function () {

  var scrollTop = this.$container.scrollTop();
  var scrollContainerHeight = this.getScrollContainerHeight();

  var itemsHeight = this.$itemsContainer.height();

  // check min/max scroll
  if (scrollTop <= 0) {
    // we're at the top of the reading list
    this.$container.trigger('reading-list-at-top');
  }

  // do bot check separate since you can be at the top/bot simultaneously if
  //  one item deep and item is shorter than window
  if (this.$container[0].scrollHeight - this.getScrollContainerHeight() - scrollTop <= 0) {
    // we're at the bottom of the reading list
    this.$container.trigger('reading-list-at-bottom');
  }

  // check bottom loading threshold
  var loadBot = false;
  if (itemsHeight - scrollTop - scrollContainerHeight <= this.settings.loadingThreshold) {
    // we're in the bottom loading threshold
    this.$container.trigger('reading-list-at-bottom-load-threshold', this.$activeItem);
    // flag that we need to load something bot
    loadBot = true;
  }

  // do event checks on individual items
  var $nowActive;
  var loadingBotCounter = 0;
  var loadedCounter = 0;
  this.$listItems.each((function (i, item) {
    var $item = $(item);
    var isActive = this.itemEventing(i, $item, $nowActive, loadBot, loadingBotCounter, loadedCounter);
    if (isActive) {
      $nowActive = $item;
    }
  }).bind(this));

  // check if we've run out of reading list content
  if (loadedCounter === this.$listItems.length && loadBot) {
    // everything is loaded, fire event
    this.$container.trigger('reading-list-out-of-content');
  }
  // found an active item, set it to the active item
  this.$activeItem = $nowActive;
  if (this.$activeItem && this.$activeItem.length > 0) {
    // fire an event with percentage of article viewed, from "looking" threshold
    //  bottom, ensure this is never over 1.0
    var bounding = this.$activeItem[0].getBoundingClientRect();
    var viewedDist = (-bounding.top + this.settings.lookingThresholdBottom) /
      bounding.height;
    var progress = viewedDist <= 1.0 ? viewedDist : 1.0;
    this.$container.trigger('reading-list-item-progress', [this.$activeItem, progress]);
  }
};

/**
 * GET an item from reading list. Returns a promise that resolves when the
 *   response comes back from the server and html is loaded in to the page.
 */
ReadingList.prototype.retrieveListItem = function ($readingListItem, successCallback,
    failCallback) {

  // set up a load status so we know we're loading
  $readingListItem.data('loadStatus', loadStatus.LOADING);
  // set up vars we'll need
  var success = successCallback || this.settings.dataRetrievalSuccess;
  var failure = failCallback || this.settings.dataRetrievalFail;
  var href = $readingListItem.data('href');
  // indicate loading is occuring
  $readingListItem.addClass('loading');

  // wrap this response stuff so we don't have any problems with var reference
  var self = this;
  return (function ($item, sCallback, fCallback) {
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
      })
      .always(function () {
        $item.data('loadStatus', status);
        if (html) {
          // add html and resolve promise so we know html is for sure on page
          $item.html(html);
        }
        // do eventing
        self.eventing();
        // event that tells us something is done loading
        self.$container.trigger('reading-list-start-item-load-done', [$item]);
      });
  })($readingListItem, success, failure);
};

/**
 * Load up all the items on the way to given reading list item.
 */
ReadingList.prototype.retrieveListItemsTo = function ($readingListItem) {
  // wrap this response stuff so we don't have any problems with var reference
  var self = this;
  return (function ($readingListItem) {
    // keep promise to resolve once they all come back
    var deferred = $.Deferred();
    // loop through reading list items and load everything up to and
    //  including given item
    var pos = self.$listItems.index($readingListItem) + 1;
    var loaded = 0;
    var completeCheck = function () {
      loaded++;
      if (pos === loaded &&
          deferred.state() !== 'resolved') {
        // we're done loading,resolve our promise
        deferred.resolve($readingListItem);
      }
    };
    self.$listItems.each(function () {
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
  })($readingListItem);
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
 * Adds content to end of reading list based on given addContent function.
 */
ReadingList.prototype.addContent = function () {
  var self = this;
  this.settings.addContent()
    .done(function (html) {
      var $item = $(html);
      // mark this new item as loaded
      $item.data('loadStatus', loadStatus.LOADED);
      // add this new item to the collection of reading list items
      self.$listItems.add($item);
      // finally, append item to reading list
      self.$itemsContainer.append($item);
      // let others know a new item has loaded
      self.$container.trigger('reading-list-start-item-load-done', [$item]);
    })
    .fail(function () {
      console.log('Add item function failed, content not added to reading list.');
    });
};

/**
 * Event for clicks of minimap items.
 */
ReadingList.prototype.miniMapItemClicked = function (e) {
  var $miniMapitem = $(e.target);
  // ensure our click event doesn't go through to the anchor
  e.preventDefault();
  // find the item to scroll to
  var itemRef = $miniMapitem.data('itemRef');

  var $item = this.$listItems.filter('#' + itemRef);
  // retrieve everything on the way to our item, then scroll to it
  var self = this;
  this.retrieveListItemsTo($item).always(function ($readingListItem) {
    var stop = function () {
      self.stop();
    };

    // ensure we can stop the animation if we want
    $document.on(MOVEMENTS, stop);

    // stop any running animations and begin a new one
    self.stop().animate({
      scrollTop: $readingListItem.position().top
    },
    self.settings.scrollToSpeed,
    function () {
      // unbind the scroll stoppage
      $document.off(MOVEMENTS, stop);
    });
  });
};

ReadingList.prototype.miniMapFindByItem = function ($item) {
  var id = $item.attr('id');
  return this.$miniMapItems.filter(function () {
    return $(this).data('itemRef') === id;
  });
};

ReadingList.prototype.miniMapItemActivate = function (e, $item) {
  this.miniMapFindByItem($item).addClass('active');
};

ReadingList.prototype.miniMapItemDeactivate = function (e, $item) {
  this.miniMapFindByItem($item).removeClass('active');
};

/**
 * Wrapper to contain reading list logic inside a subobject of jquery element.
 */
var createReadingList = function (options) {

  // note: 'this' refers to the jquery object wrapping the reading list element
  this.readingList = new ReadingList(this, options);

  return this;
};

// attach this as a jquery plugin
$.fn.asReadingList = createReadingList;

// expose reading list functions
module.exports = ReadingList;
