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

      $validReadingList.readingList.ready.should.equal(true);
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

    it('should load everything up to and including an item marked with a load-to attribute', function () {
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
      }))).to.equal(true);
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

    it('when an item starts to load', function () {

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
  });

  describe('mobile support', function () {

    beforeEach(function () {
      $.browser.mobile = true;
    });

    afterEach(function () {
      $.browser.mobile = false;
    });

    it('should use iscroll', function () {
      $validReadingList.asReadingList();

      expect($validReadingList.iscrollRef).to.exist;
    });
  });

});
