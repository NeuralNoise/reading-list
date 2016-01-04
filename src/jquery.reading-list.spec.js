/* jshint expr: true */

describe('Reading list', function () {

  var $readingListHolder = $('<div>');
  var $validReadingList;
  var ReadingList;
  var sandbox;
  var server;

  var jqueryMatcher = function ($ele) {
    return sinon.match(function ($arg) {
      return $arg.is($ele);
    }, 'jquery object similarity');
  };

  $(window.document.body).append($readingListHolder);

  beforeEach(function () {
    ReadingList = require('jquery.reading-list.js');

    $validReadingList = $(
      '<div class="reading-list-content">' +
        '<div class="reading-list-items"></div>' +
      '</div>'
    );
    $readingListHolder.append($validReadingList);

    server = sinon.fakeServer.create();
    server.respondWith('no response set up');

    // sandbox for everything
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    $readingListHolder.empty();
    sandbox.restore();
    server.restore();
  });

  describe('initialization', function () {

    it('works via a selected jquery element', function () {
      var $constructedReadingList = $validReadingList.readingList();

      var readingList = $validReadingList.data('pluginReadingList');

      $constructedReadingList.should.equal($validReadingList);
      readingList.ready.should.be.true;
    });

    it('fails with an error when an jquery element selection is empty', function () {
      var $readingList = $();

      expect($readingList.readingList).to.throw(Error);
      expect($readingList.data('pluginReadingList')).to.be.undefined;
    });

    it('fails with an error when reading list element is missing an items container', function () {
      var $readingList = $('<div></div>');

      expect($readingList.readingList).to.throw(Error);
      expect($readingList.data('pluginReadingList')).to.be.undefined;
    });

    it('should load the first item', function () {
      var url = '/something1';
      var $item = $('<div class="item" href="' + url + '"></div>');

      $validReadingList.find('.reading-list-items').append($item);

      var retrieveSpy = sandbox.spy(ReadingList.prototype, 'retrieveListItem');

      var readingList = new ReadingList($validReadingList, {
        selectorsItems: '.item'
      });

      expect(retrieveSpy.calledWith(sinon.match(function ($arg) {
        return $arg.is($item);
      }))).to.be.true;
    });

    it('should load everything up to and including an item marked with data-load-to="true" attribute', function () {
      var url1 = '/something1';
      var url2 = '/something2';
      var url3 = '/something3';

      var $item1 = $('<div class="item" href="' + url1 + '"></div>');
      var $item2 = $('<div class="item" href="' + url2 + '"></div>');
      var $item3 = $('<div class="item" href="' + url3 + '" data-load-to="true"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);

      var retrieveSpy = sandbox.spy(ReadingList.prototype, 'retrieveListItemsTo');

      var readingList = new ReadingList($validReadingList, {
        selectorsItems: '.item'
      });

      expect(retrieveSpy.calledWith(jqueryMatcher($item3))).to.be.true;
    });

    it('should call onPreSetup function if provided', function () {
      var onPreSetup = sandbox.stub();

      var readingList = new ReadingList($validReadingList, {
        onPreSetup: onPreSetup
      });

      onPreSetup.called.should.be.true;
      onPreSetup.args[0][0].should.equal(readingList);
    });

    it('should call onReady function if provided', function () {
      var onReady = sandbox.stub();

      var readingList = new ReadingList($validReadingList, {
        onReady: onReady
      });

      onReady.called.should.be.true;
      onReady.args[0][0].should.equal(readingList);
    });

    it('should fire top event', function () {
      var trigger = sandbox.spy($validReadingList, 'trigger');
      var readingList = new ReadingList($validReadingList);

      trigger.withArgs('reading-list-at-top').callCount.should.equal(1);
    });

    it('should fire item load done event for any items already loaded in', function () {
      var preLoadedClass = 'pre-loaded';

      var $item1 = $('<div class="item ' + preLoadedClass + '" href="/one"></div>');
      var $item2 = $('<div class="item ' + preLoadedClass + '" href="/two"></div>');
      var $item3 = $('<div class="item" href="/three"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);

      var trigger = sandbox.spy($validReadingList, 'trigger');

      var readingList = new ReadingList($validReadingList, {
        selectorsItems: '.item',
        selectorsItemsPreLoaded: '.' + preLoadedClass
      });

      var events = trigger.withArgs('reading-list-item-load-done');
      events.callCount.should.equal(2);

      expect(jqueryMatcher(events.args[0][1][0]).test($item1)).to.be.true;
      expect(jqueryMatcher(events.args[1][1][0]).test($item2)).to.be.true;
    });

    it('should fire in looking event for first preloaded item', function () {
      var $item1 = $('<div class="reading-list-item reading-list-loaded" href="/one"></div>');
      var $item2 = $('<div class="reading-list-item reading-list-loaded" href="/two"></div>');
      var $item3 = $('<div class="reading-list-item" href="/three"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);

      var trigger = sandbox.spy($validReadingList, 'trigger');

      var readingList = new ReadingList($validReadingList, {});

      var events = trigger.withArgs('reading-list-item-in-looking');
      events.callCount.should.equal(1);

      expect(jqueryMatcher(events.args[0][1][0]).test($item1)).to.be.true;
    });

    it('should fire progress event for first preloaded item', function () {
      var $item1 = $('<div class="reading-list-item reading-list-loaded" href="/one"></div>');
      var $item2 = $('<div class="reading-list-item reading-list-loaded" href="/two"></div>');
      var $item3 = $('<div class="reading-list-item" href="/three"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);

      var trigger = sandbox.spy($validReadingList, 'trigger');

      var readingList = new ReadingList($validReadingList, {});

      var events = trigger.withArgs('reading-list-item-progress');
      events.callCount.should.equal(1);

      expect(jqueryMatcher(events.args[0][1][0]).test($item1)).to.be.true;
      expect(events.args[0][1][1].progress).to.equal(0);
    });

    it('should set the active item to the first item in the list', function () {

      var $item1 = $('<div class="reading-list-item reading-list-loaded" href="/one"></div>');
      var $item2 = $('<div class="reading-list-item reading-list-loaded" href="/two"></div>');
      var $item3 = $('<div class="reading-list-item" href="/three"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);

      var readingList = new ReadingList($validReadingList, {});

      expect(jqueryMatcher(readingList.$activeItem).test($item1)).to.be.true;
    });
  });

  describe('has scrolling-realated events for', function () {
    var readingList;
    var trigger;
    var $item1;
    var $item2;
    var $item3;

    beforeEach(function () {
      // set up some test items
      $item1 = $('<div id="item1" class="reading-list-item"></div>');
      $item2 = $('<div id="item2" class="reading-list-item"></div>');
      $item3 = $('<div id="item3" class="reading-list-item"></div>');
      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2)
        .append($item3);
      // pretend first item is loaded
      $item1.data('loadStatus', 'loaded');

      // don't bother with setup since we just need to test the eventing function
      sandbox.stub(ReadingList.prototype, '_setup');
      readingList = new ReadingList($validReadingList);
      trigger = sandbox.spy(readingList.$container, 'trigger');
    });

    describe('entire reading list', function () {
      var _itemEventing;

      beforeEach(function () {
        // skip individual item eventing
        _itemEventing = sandbox.stub(ReadingList.prototype, '_itemEventing');
      });

      it('when at the top of the list', function () {
        // note: we're at the top of the list when scroll top is 0

        var scrollTop = sandbox.stub(readingList.$container, 'scrollTop');

        // scroll down and ensure reading list at top does not fire
        scrollTop.returns(100);
        readingList._unthrottledEventing();

        // scroll top and ensure reading list at top event does fire
        scrollTop.returns(0);
        readingList._unthrottledEventing();

        trigger.withArgs('reading-list-at-top').callCount.should.equal(1);
      });

      it('when the reading list is out of content', function () {
        // note: we're out of content when all reading list items have been loaded and
        //  we've gone past the bottom load threshold

        var scrollTop = sandbox.stub(readingList.$container, 'scrollTop');

        readingList.settings.scrollContainerHeight = function () {
          return 300;
        };
        readingList.settings.loadingThreshold = 300;
        readingList.$container[0] = {scrollHeight: 1000};

        var _addContent = sandbox.stub(readingList, '_addContent');

        // cause out of content event to fire
        _itemEventing.returns(5);
        sandbox.stub(readingList.$listItems, 'length', 5);

        // scroll to a point above loading threshold, should not fire
        scrollTop.returns(300);
        readingList._unthrottledEventing();

        // scroll past threshold, should fire
        scrollTop.returns(600);
        readingList._unthrottledEventing();

        trigger.withArgs('reading-list-out-of-content').callCount.should.equal(1);
        _addContent.callCount.should.equal(1);
      });

      it('when scrolling to an item', function () {
        var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');

        readingList.settings.scrollToSpeed = 0;
        readingList._unthrottledEventing();

        readingList.scrollToItem($item3);

        _doItemEvent.withArgs('reading-list-start-scroll-to').callCount.should.equal(1);
        _doItemEvent.withArgs('reading-list-end-scroll-to').callCount.should.equal(1);
      });
    });

    describe('an individual item', function () {

      it('through a utility function', function () {

        var eventName = 'something';
        var arg1 = 'one';
        var arg2 = 'two';
        var arg3 = 'three';
        var args = {
          arg1: arg1,
          arg2: arg2,
          arg3: arg3
        };

        var numberOfCalls = 3;
        readingList._doItemEvent(eventName, $item1, args, true);
        readingList._doItemEvent(eventName, $item1, args, true);
        readingList._doItemEvent(eventName, $item1, args, true);

        var events = trigger.withArgs(eventName);
        events.callCount.should.equal(numberOfCalls);

        var callCount = 0;
        events.args.forEach(function (argList) {
          expect(argList[0]).to.equal(eventName);
          expect(jqueryMatcher(argList[1][0]).test($item1)).to.be.true;
          expect(argList[1][1].callCount).to.equal(++callCount);
          expect(argList[1][1].arg1).to.equal(arg1);
          expect(argList[1][1].arg2).to.equal(arg2);
          expect(argList[1][1].arg3).to.equal(arg3);
        });

        expect(callCount).to.equal(numberOfCalls);
      });

      it('when it starts loading', function () {
        var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');
        var loaded = readingList._itemEventing(true);

        var calls = _doItemEvent.withArgs('reading-list-item-load-start');
        calls.callCount.should.equal(1);

        var args = calls.args[0];

        expect(jqueryMatcher(args[1]).test($item2)).to.be.true;
        args[2].direction.should.equal('down');

        // only 1 item was previously loaded
        loaded.should.equal(1);
      });

      it('when it falls into the view', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');
        var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');

        // pretend item2 is in the looking area
        readingList.$activeItem = $item1;
        withinLookingArea.withArgs($item2[0]).returns(true);

        // do item eventing
        readingList._itemEventing(true);

        var _doItemEventCalls = _doItemEvent.withArgs('reading-list-item-in-looking');
        _doItemEventCalls.callCount.should.equal(1);

        expect(jqueryMatcher($item2).test(readingList.$activeItem)).to.be.true;
        $item2.hasClass('reading-list-in-looking').should.be.true;
      });

      it('when it falls out of view', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');
        var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');

        // pretend item2 has moved out of looking area, and item3 has moved in
        readingList.$activeItem = $item2;
        withinLookingArea.withArgs($item2[0]).returns(false);
        withinLookingArea.withArgs($item3[0]).returns(true);

        // do item eventing
        readingList._itemEventing(true);

        var _doItemEventCalls = _doItemEvent.withArgs('reading-list-item-out-looking');
        _doItemEventCalls.callCount.should.equal(1);

        expect(jqueryMatcher($item2).test(readingList.$activeItem)).to.be.false;
        expect(jqueryMatcher($item3).test(readingList.$activeItem)).to.be.true;
        $item2.hasClass('reading-list-in-looking').should.be.false;
      });

      it('showing what percentage of it has been viewed', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');
        var _doItemEvent = sandbox.spy(readingList, '_doItemEvent');

        // pretend item2 is in the looking area
        readingList.$activeItem = $item1;
        withinLookingArea.withArgs($item1[0]).returns(true);

        // stub out bounding client rect function
        var getBoundingClientRect = sandbox.stub(readingList.$activeItem[0], 'getBoundingClientRect');

        // keep some constants for these calculations
        readingList.settings.lookingThresholdBottom = 300;
        var boundingHeight = 1500;

        // 0% viewed
        getBoundingClientRect.returns({
          top: 300,
          height: boundingHeight
        });
        readingList._itemEventing(true);

        // 45% viewed
        getBoundingClientRect.returns({
          top: -375,
          height: boundingHeight
        });
        readingList._itemEventing(true);

        // 100% viewed and now passing bottom of item, really over 100%, but should
        //  be capped at 100%
        getBoundingClientRect.returns({
          top: -1500,
          height: boundingHeight
        });
        readingList._itemEventing(true);

        // sort out trigger calls
        var _doItemEventCalls = _doItemEvent.withArgs('reading-list-item-progress');
        var events = trigger.withArgs('reading-list-item-progress');
        events.callCount.should.equal(3);
        _doItemEventCalls.callCount.should.equal(3);

        // check 0% call
        var callbackArgs1 = events.args[0][1];
        expect(jqueryMatcher($item1).test(callbackArgs1[0])).to.be.true;
        expect(callbackArgs1[1].progress).to.equal(0);

        // check 45% call
        var callbackArgs2 = events.args[1][1];
        expect(jqueryMatcher($item1).test(callbackArgs2[0])).to.be.true;
        expect(callbackArgs2[1].progress).to.equal(0.45);

        // check over 100% call
        var callbackArgs3 = events.args[2][1];
        expect(jqueryMatcher($item1).test(callbackArgs3[0])).to.be.true;
        expect(callbackArgs3[1].progress).to.equal(1.0);
      });
    });
  });

  describe('item retrieval', function () {
    var $item1;
    var doGET;
    var href1 = '/something';
    var readingList;
    var trigger;

    beforeEach(function () {
      // set up some test items
      $item1 = $('<div id="item1" data-href="' + href1 + '" class="reading-list-item"></div>');
      $validReadingList.find('.reading-list-items').append($item1);

      sandbox.stub(ReadingList.prototype, '_setup');

      readingList = new ReadingList($validReadingList);
      trigger = sandbox.spy(readingList.$container, 'trigger');

      readingList.eventing = sandbox.stub();

      doGET = sandbox.stub($, 'get');
    });

    it('should prepare item element for loading', function () {
      var deferred = $.Deferred();
      doGET.returns(deferred.promise());

      readingList.retrieveListItem($item1);

      $item1.data('loadStatus').should.equal('loading');
      $item1.hasClass('reading-list-loading').should.be.true;
    });

    it('should update item element on success', function () {
      var responseContent = '<div>some html content</div>';
      var success = sandbox.stub();

      var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');

      readingList.settings.dataRetrievalSuccess = success;
      success.returns(responseContent);

      var deferred = $.Deferred();
      deferred.resolve(responseContent);
      doGET.returns(deferred.promise());

      // do call we're going to test
      readingList.retrieveListItem($item1);

      // check that everything is in place for the success call
      success.callCount.should.equal(1);
      expect(jqueryMatcher($item1).test(success.args[0][0])).to.be.true;
      success.args[0][1].should.equal(responseContent);

      $item1.hasClass('reading-list-loading').should.be.false;
      $item1.hasClass('reading-list-loaded').should.be.true;
      $item1.data('loadStatus').should.equal('loaded');
      $item1.html().should.equal(responseContent);
      readingList.eventing.callCount.should.equal(1);

      var _doItemEventCalls = _doItemEvent.withArgs('reading-list-item-load-done');
      _doItemEventCalls.callCount.should.equal(1);
    });

    it('should update item element on failure', function () {
      var responseContent = '<div>some html content</div>';
      var fail = sandbox.stub();

      var _doItemEvent = sandbox.stub(readingList, '_doItemEvent');

      readingList.settings.dataRetrievalFail = fail;
      fail.returns(responseContent);

      var deferred = $.Deferred();
      deferred.reject(responseContent);
      doGET.returns(deferred.promise());

      // do call we're going to test
      readingList.retrieveListItem($item1);

      // check that everything is in place for the success call
      fail.callCount.should.equal(1);
      expect(jqueryMatcher($item1).test(fail.args[0][0])).to.be.true;

      $item1.hasClass('reading-list-loading').should.be.false;
      $item1.hasClass('reading-list-load-failed').should.be.true;
      $item1.data('loadStatus').should.equal('failed');
      $item1.html().should.equal(responseContent);
      readingList.eventing.callCount.should.equal(1);

      var _doItemEventCalls = _doItemEvent.withArgs('reading-list-item-load-done');
      _doItemEventCalls.callCount.should.equal(1);
    });

  });

  describe('config options', function () {

    it('should prevent bubbling when noEventBubbling is true', function () {

      sandbox.stub(ReadingList.prototype, 'miniMapItemActivate');
      sandbox.stub(ReadingList.prototype, 'miniMapItemDeactivate');
      sandbox.stub(ReadingList.prototype, '_startItemLoad');
      sandbox.stub(ReadingList.prototype, '_initialLoad');
      sandbox.stub(ReadingList.prototype, '_unthrottledEventing');

      var readingList = new ReadingList($validReadingList, {
        noEventBubbling: true
      });
      var callback = sandbox.spy();
      var docCallback = sandbox.spy();

      readingList.$container.on(
        'reading-list-at-top ' +
        'reading-list-out-of-content ' +
        'reading-list-item-load-start ' +
        'reading-list-item-in-looking ' +
        'reading-list-item-out-looking ' +
        'reading-list-item-progress ' +
        'reading-list-item-load-done ' +
        'reading-list-start-scroll-to ' +
        'reading-list-end-scroll-to',
        callback);
      $(document).on(
        'reading-list-at-top ' +
        'reading-list-out-of-content ' +
        'reading-list-item-load-start ' +
        'reading-list-item-in-looking ' +
        'reading-list-item-out-looking ' +
        'reading-list-item-progress ' +
        'reading-list-item-load-done ' +
        'reading-list-start-scroll-to ' +
        'reading-list-end-scroll-to',
        docCallback);

      readingList.$container.trigger('reading-list-at-top');
      readingList.$container.trigger('reading-list-out-of-content');
      readingList.$container.trigger('reading-list-item-load-start');
      readingList.$container.trigger('reading-list-item-in-looking');
      readingList.$container.trigger('reading-list-item-out-looking');
      readingList.$container.trigger('reading-list-item-progress');
      readingList.$container.trigger('reading-list-item-load-done');
      readingList.$container.trigger('reading-list-start-scroll-to');
      readingList.$container.trigger('reading-list-end-scroll-to');

      callback.callCount.should.equal(9);
      docCallback.callCount.should.equal(0);
    });
  });

  describe('misc functions', function () {
    var readingList;

    beforeEach(function () {
      // don't bother with setup since we just need to test the calculating function
      sandbox.stub(ReadingList.prototype, '_setup');
      readingList = new ReadingList($validReadingList);
    });

    it('should have a test for elements being in looking area', function () {
      var _elementBoundingInsideArea = sandbox.stub(readingList, '_elementBoundingInsideArea');
      var el = {};

      readingList.settings.lookingThresholdTop = 200;
      readingList.settings.lookingThresholdBottom = 500;

      readingList.withinLookingArea(el);

      _elementBoundingInsideArea.withArgs(
        el,
        readingList.settings.lookingThresholdTop,
        readingList.settings.lookingThresholdBottom).callCount.should.equal(1);
    });

    it('should have a test for bounding boxes being in a particular area', function () {
      var el = {};
      el.getBoundingClientRect = sandbox.stub();

      // totally above box
      el.getBoundingClientRect.returns({top: -500, bottom: 100});
      readingList._elementBoundingInsideArea(el, 200, 500).should.be.false;

      // bottom inside box
      el.getBoundingClientRect.returns({top: -500, bottom: 300});
      readingList._elementBoundingInsideArea(el, 200, 500).should.be.true;

      // totally inside box
      el.getBoundingClientRect.returns({top: 300, bottom: 400});
      readingList._elementBoundingInsideArea(el, 200, 500).should.be.true;

      // top inside box
      el.getBoundingClientRect.returns({top: 300, bottom: 600});
      readingList._elementBoundingInsideArea(el, 200, 500).should.be.true;

      // totally below box
      el.getBoundingClientRect.returns({top: 600, bottom: 800});
      readingList._elementBoundingInsideArea(el, 200, 500).should.be.false ;
    });

    describe('include a way to scroll to a given item that', function () {

      it('should scroll to given item', function () {
        var $item1 = $('<div id="item1" class="reading-list-item"></div>');
        var $item2 = $('<div id="item2" class="reading-list-item"></div>');
        var stop = sandbox.spy(readingList.$container, 'stop');
        var animate = sandbox.spy(readingList.$container, 'animate');
        var scrollToSpeed = 123;

        $validReadingList.find('.reading-list-items')
          .append($item1)
          .append($item2);

        readingList.settings.scrollToSpeed = scrollToSpeed;
        readingList.settings.scrollToAddPx = function () { return 10; };

        readingList.scrollToItem($item2);

        stop.calledOnce.should.be.true;
        animate.calledOnce.should.be.true;
        animate.args[0][0].scrollTop.should.equal(
          $item2.position().top + readingList.settings.scrollToAddPx()
        );
        animate.args[0][1].should.equal(scrollToSpeed);
      });

      it('should use a zero scroll to speed when user is mobile', function () {
        var $item1 = $('<div id="item1" class="reading-list-item"></div>');
        var $item2 = $('<div id="item2" class="reading-list-item"></div>');
        var animate = sandbox.spy(readingList.$container, 'animate');
        var isMobile = sandbox.stub(readingList, '_isMobile');

        $validReadingList.find('.reading-list-items')
          .append($item1)
          .append($item2);

        isMobile.returns(true);
        readingList.settings.scrollToSpeed = 123;

        readingList.scrollToItem($item2);

        isMobile.calledOnce.should.be.true;
        animate.args[0][1].should.equal(0);
      });
    });

    describe('include a way to retrieve isMobile setting that', function () {

      it('should call setting if it is a function', function () {
        var isMobile = true;

        readingList.settings.isMobile = function () { return isMobile; };

        expect(readingList._isMobile()).to.equal(isMobile);
      });

      it('should return setting if it is a boolean', function () {
        var isMobile = true;

        readingList.settings.isMobile = isMobile;

        expect(readingList._isMobile()).to.equal(isMobile);
      });

      it('should return false if setting is not a function or boolean', function () {
        readingList.settings.isMobile = 'true';

        expect(readingList._isMobile()).to.equal(false);
      });
    });
  });

  describe('utilities', function () {

    it('should have a function to attach an event callback that can be stubbed later', function () {
      var $body = $(document.body);
      var callbackName = 'someCallbackFunction';
      var eventName = 'some-test-event';
      var myReadingList = {};
      var readingList = new ReadingList($validReadingList);

      myReadingList[callbackName] = function () {};

      $body.on(eventName, readingList.callback(myReadingList, callbackName));

      var callback = sandbox.stub(myReadingList, callbackName);

      $body.trigger(eventName);

      $body.off();

      expect(callback.calledOnce).to.be.true;
    });
  });

  describe('normal operation', function () {

    it('should keep active item set to last active item if it would otherwise be undefined', function () {
      var $item1 = $('<div class="reading-list-item"></div>');

      $validReadingList.find('.reading-list-items').append($item1);

      var readingList = new ReadingList($validReadingList);
      var $oldActiveItem = readingList.$activeItem;

      sandbox.stub(readingList, 'withinLookingArea').returns(false);

      readingList._itemEventing();

      expect(jqueryMatcher($oldActiveItem).test($item1)).to.be.true;
      expect(jqueryMatcher(readingList.$activeItem).test($item1)).to.be.true;
    });
  });
});
