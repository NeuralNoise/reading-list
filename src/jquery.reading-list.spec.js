/* jshint expr: true */

describe('Reading list', function () {

  var ReadingList;
  var $validReadingList;
  var $readingListHolder = $('<div>');

  $(window.document.body).append($readingListHolder);

  beforeEach(function () {
    ReadingList = require('jquery.reading-list.js');

    $validReadingList = $(
      '<div class="reading-list-content">' +
        '<div class="reading-list-items"></div>' +
      '</div>'
    );
    $readingListHolder.append($validReadingList);
  });

  afterEach(function () {
    $readingListHolder.empty();
  });

  describe('initialization', function () {

    it('works via a selected jquery element', function () {
      var $constructedReadingList = $validReadingList.asReadingList();

      $validReadingList.readingList.ready.should.be.true;
      $constructedReadingList.should.equal($validReadingList);
    });

    it('fails with an error when an jquery element selection is empty', function () {
      var $readingList = $();

      expect($readingList.asReadingList).to.throw(Error);
      expect($readingList.readingList).to.not.exist;
    });

    it('fails with an error when reading list element is missing an items container', function () {
      var $readingList = $('<div></div>');

      expect($readingList.asReadingList).to.throw(Error);
      expect($readingList.readingList).to.not.exist;
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

      expect(retrieveSpy.calledWith(sinon.match(function ($arg) {
        return $arg.is($item3);
      }))).to.be.true;
    });
  });

  describe('has events for', function () {
    var doGET;

    beforeEach(function () {
      doGET = sinon.stub($, 'get');
      var deferred = $.Deferred();
      deferred.resolve();
      doGET.returns(deferred.promise());
    });

    afterEach(function () {
      doGET.restore();
    });

    it('when at the top of the list', function () {
    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when at the bottom of the list', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when past the loading threshold', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when an item starts loading', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when an item falls into the view', function () {
    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when an item falls out of view', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('showing how much of an item has been viewed', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when an item is done loading ', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('when the reading list is out of content', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });
  });

  describe('item retrieval', function () {

    it('should prepare item element for loading', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('should update item element on success', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('should update item element on failure', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });
  });

  describe('mobile support', function () {
    var mobileSandbox;

    beforeEach(function () {
      mobileSandbox = sinon.sandbox.create();

      var browserMock = mobileSandbox.stub($.browser);
      browserMock.mobile = true;
    });

    afterEach(function () {
      mobileSandbox.restore();
    });

    it('should use iscroll', function () {
      var iscrollMock = mobileSandbox.stub(window, 'IScroll');

      var readingList = new ReadingList($validReadingList, {});

      iscrollMock.calledWithNew().should.be.true;
      readingList.iscrollRef.should.exist;
    });

    it('should refresh iscroll when an item is done loading', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });

    it('should refresh iscroll on select events', function () {

    // TODO : fill this in
      throw new Error('Not implemented yet.');
    });
  });

});
