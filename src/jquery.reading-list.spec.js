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

      readingList.ready.should.be.true;
      $constructedReadingList.should.equal($validReadingList);
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

      var retrieveSpy = sinon.spy(ReadingList.prototype, 'retrieveListItem');

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

      var retrieveSpy = sinon.spy(ReadingList.prototype, 'retrieveListItemsTo');

      var readingList = new ReadingList($validReadingList, {
        selectorsItems: '.item'
      });

      expect(retrieveSpy.calledWith(jqueryMatcher($item3))).to.be.true;
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
      sandbox.stub(ReadingList.prototype, 'setup');
      readingList = new ReadingList($validReadingList);
      trigger = sandbox.spy(readingList.$container, 'trigger');
    });

    describe('entire reading list', function () {
      var itemEventing;

      beforeEach(function () {
        // skip individual item eventing
        itemEventing = sandbox.stub(ReadingList.prototype, 'itemEventing');
      });

      it('when at the top of the list', function () {
        // note: we're at the top of the list when scroll top is 0

        var scrollTop = sandbox.stub(readingList.$container, 'scrollTop');

        // scroll down and ensure reading list at top does not fire
        scrollTop.returns(100);
        readingList.unthrottledEventing();

        // scroll top and ensure reading list at top event does fire
        scrollTop.returns(0);
        readingList.unthrottledEventing();

        trigger.withArgs('reading-list-at-top').callCount.should.equal(1);
      });

      it('when at the bottom of the list', function () {
        // note: we're at the bottom of the list when scrollHeight = height + scrollTop
        //  or scrollHeight - height - scrollTop = 0

        var scrollTop = sandbox.stub(readingList.$container, 'scrollTop');

        readingList.settings.scrollContainerHeight = function () {
          return 300;
        };
        readingList.$container[0] = {scrollHeight: 1000};

        // scroll to middle, event should not fire
        scrollTop.returns(300);
        readingList.unthrottledEventing();

        // scroll to bottom, event should fire
        scrollTop.returns(700);
        readingList.unthrottledEventing();

        trigger.withArgs('reading-list-at-bottom').callCount.should.equal(1);
      });

      it('when past the loading threshold', function () {
        // note: we're past the loading threshold when
        //  total scroll area - scrollTop - visible scroll area <= loadingThreshold

        var scrollTop = sandbox.stub(readingList.$container, 'scrollTop');

        readingList.settings.scrollContainerHeight = function () {
          return 300;
        };
        readingList.settings.loadingThreshold = 300;
        readingList.$container[0] = {scrollHeight: 1000};

        // prevent out of content event from firing
        itemEventing.returns(4);
        sandbox.stub(readingList.$listItems, 'length', 5);

        // scroll to a point above loading threshold, should not fire
        scrollTop.returns(300);
        readingList.unthrottledEventing();

        // scroll past threshold, should fire
        scrollTop.returns(600);
        readingList.unthrottledEventing();

        trigger.withArgs('reading-list-at-bottom-load-threshold').callCount.should.equal(1);
        trigger.withArgs('reading-list-out-of-content').callCount.should.equal(0);
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

        // cause out of content event to fire
        itemEventing.returns(5);
        sandbox.stub(readingList.$listItems, 'length', 5);

        // scroll to a point above loading threshold, should not fire
        scrollTop.returns(300);
        readingList.unthrottledEventing();

        // scroll past threshold, should fire
        scrollTop.returns(600);
        readingList.unthrottledEventing();

        trigger.withArgs('reading-list-at-bottom-load-threshold').callCount.should.equal(1);
        trigger.withArgs('reading-list-out-of-content').callCount.should.equal(1);
      });
    });

    describe('an individual item', function () {

      it('when it starts loading', function () {
        // do eventing for items
        var loaded = readingList.itemEventing(true);

        // sort out trigger calls
        var events = trigger.withArgs('reading-list-start-item-load');
        events.callCount.should.equal(1);

        // check the arguments that will be given to callbacks for this event
        var callbackArgs = events.args[0][1];
        expect(jqueryMatcher($item2).test(callbackArgs[0])).to.be.true;
        callbackArgs[1].should.equal('down');

        // only 1 item was previously loaded
        loaded.should.equal(1);
      });

      it('when it falls into the view', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');

        // pretend item2 is in the looking area
        readingList.$activeItem = $item1;
        withinLookingArea.withArgs($item2[0]).returns(true);

        // do item eventing
        readingList.itemEventing(true);

        // sort out trigger calls
        var events = trigger.withArgs('reading-list-item-in-looking');
        events.callCount.should.equal(1);

        // check the arguments that will be given to callbacks for this event
        var callbackArgs = events.args[0][1];
        expect(jqueryMatcher($item2).test(callbackArgs[0])).to.be.true;

        expect(jqueryMatcher($item2).test(readingList.$activeItem)).to.be.true;
        $item2.hasClass('reading-list-in-looking').should.be.true;
      });

      it('when it falls out of view', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');

        // pretend item2 has moved out of looking area, and item3 has moved in
        readingList.$activeItem = $item2;
        withinLookingArea.withArgs($item2[0]).returns(false);
        withinLookingArea.withArgs($item3[0]).returns(true);

        // do item eventing
        readingList.itemEventing(true);

        // sort out trigger calls
        var events = trigger.withArgs('reading-list-item-out-looking');
        events.callCount.should.equal(1);

        // check the arguments that will be given to callbacks for this event
        var callbackArgs = events.args[0][1];
        expect(jqueryMatcher($item2).test(callbackArgs[0])).to.be.true;

        expect(jqueryMatcher($item2).test(readingList.$activeItem)).to.be.false;
        expect(jqueryMatcher($item3).test(readingList.$activeItem)).to.be.true;
        $item2.hasClass('reading-list-in-looking').should.be.false;
      });

      it('showing what percentage of it has been viewed', function () {
        // stub out within looking area function to test separately
        var withinLookingArea = sandbox.stub(readingList, 'withinLookingArea');

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
        readingList.itemEventing(true);

        // 45% viewed
        getBoundingClientRect.returns({
          top: -375,
          height: boundingHeight
        });
        readingList.itemEventing(true);

        // 100% viewed and now passing bottom of item, really over 100%, but should
        //  be capped at 100%
        getBoundingClientRect.returns({
          top: -1500,
          height: boundingHeight
        });
        readingList.itemEventing(true);

        // sort out trigger calls
        var events = trigger.withArgs('reading-list-item-progress');
        events.callCount.should.equal(3);

        // check 0% call
        var callbackArgs1 = events.args[0][1];
        expect(jqueryMatcher($item1).test(callbackArgs1[0])).to.be.true;
        expect(callbackArgs1[1]).to.equal(0);

        // check 45% call
        var callbackArgs2 = events.args[1][1];
        expect(jqueryMatcher($item1).test(callbackArgs2[0])).to.be.true;
        expect(callbackArgs2[1]).to.equal(0.45);

        // check over 100% call
        var callbackArgs3 = events.args[2][1];
        expect(jqueryMatcher($item1).test(callbackArgs3[0])).to.be.true;
        expect(callbackArgs3[1]).to.equal(1.0);
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

      sandbox.stub(ReadingList.prototype, 'setup');

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

      // check load done event
      var events = trigger.withArgs('reading-list-start-item-load-done');
      events.callCount.should.equal(1);
      expect(jqueryMatcher($item1).test(events.args[0][1][0])).to.be.true;
    });

    it('should update item element on failure', function () {
      var responseContent = '<div>some html content</div>';
      var fail = sandbox.stub();

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

      // check load done event
      var events = trigger.withArgs('reading-list-start-item-load-done');
      events.callCount.should.equal(1);
      expect(jqueryMatcher($item1).test(events.args[0][1][0])).to.be.true;
    });

  });

  describe('mobile support', function () {
    var iscrollMock;
    var readingList;
    var testEventName = 'some-event';

    beforeEach(function () {
      var browserMock = sandbox.stub($.browser);
      browserMock.mobile = true;

      iscrollMock = sandbox.stub(window, 'IScroll');

      readingList = new ReadingList($validReadingList, {
        refreshIScrollOn: [testEventName]
      });

      readingList.iscrollRef.refresh = sandbox.stub();
    });

    it('should use iscroll', function () {
      iscrollMock.calledWithNew().should.be.true;
      readingList.iscrollRef.should.exist;
    });

    it('should refresh iscroll when an item is done loading', function () {
      readingList.$container.trigger('reading-list-start-item-load-done');

      readingList.iscrollRef.refresh.callCount.should.equal(1);
    });

    it('should refresh iscroll on select events', function () {
      $(document).trigger(testEventName);

      readingList.iscrollRef.refresh.callCount.should.equal(1);
    });
  });

  describe('config options', function () {

    it('should call out of content function when defined', function () {
      var addContent = sandbox.stub();

      var deferred = $.Deferred();
      deferred.resolve();
      addContent.returns(deferred.promise());

      var readingList = new ReadingList($validReadingList, {
        addContent: addContent
      });

      readingList.$container.trigger('reading-list-out-of-content');

      addContent.callCount.should.equal(1);
    });
  });

  describe('misc functions', function () {
    var readingList;

    beforeEach(function () {
      // don't bother with setup since we just need to test the calculating function
      sandbox.stub(ReadingList.prototype, 'setup');
      readingList = new ReadingList($validReadingList);
    });

    it('should have a way to scroll to a given item', function () {
      var stop = sandbox.spy(readingList.$container, 'stop');
      var animate = sandbox.spy(readingList.$container, 'animate');

      var $item1 = $('<div id="item1" class="reading-list-item"></div>');
      var $item2 = $('<div id="item2" class="reading-list-item"></div>');

      $validReadingList.find('.reading-list-items')
        .append($item1)
        .append($item2);

      readingList.settings.scrollToSpeed = 0;

      readingList.scrollToItem($item2);

      stop.calledOnce.should.be.true;
      animate.calledOnce.should.be.true;
      animate.args[0][0].scrollTop.should.equal($item2.position().top);
    });

    it('should have a test for elements being in looking area', function () {
      var elementBoundingInsideArea = sandbox.stub(readingList, 'elementBoundingInsideArea');
      var el = {};

      readingList.settings.lookingThresholdTop = 200;
      readingList.settings.lookingThresholdBottom = 500;

      readingList.withinLookingArea(el);

      elementBoundingInsideArea.withArgs(
        el,
        readingList.settings.lookingThresholdTop,
        readingList.settings.lookingThresholdBottom).callCount.should.equal(1);
    });

    it('should have a test for bounding boxes being in a particular area', function () {
      var el = {};
      el.getBoundingClientRect = sandbox.stub();

      // totally above box
      el.getBoundingClientRect.returns({top: -500, bottom: 100});
      readingList.elementBoundingInsideArea(el, 200, 500).should.be.false;

      // bottom inside box
      el.getBoundingClientRect.returns({top: -500, bottom: 300});
      readingList.elementBoundingInsideArea(el, 200, 500).should.be.true;

      // totally inside box
      el.getBoundingClientRect.returns({top: 300, bottom: 400});
      readingList.elementBoundingInsideArea(el, 200, 500).should.be.true;

      // top inside box
      el.getBoundingClientRect.returns({top: 300, bottom: 600});
      readingList.elementBoundingInsideArea(el, 200, 500).should.be.true;

      // totally below box
      el.getBoundingClientRect.returns({top: 600, bottom: 800});
      readingList.elementBoundingInsideArea(el, 200, 500).should.be.false ;
    });
  });

});