/* jshint expr: true */

describe('Reading list', function () {

  var $validReadingList;

  beforeEach(function () {
    $validReadingList = $(
      '<div>' +
        '<div class="reading-list-items"></div>' +
      '</div>'
    );
  });

  describe('initialization', function () {

    it('works via a selected jquery element', function () {
      var $constructedReadingList = $validReadingList.readingList();

      $validReadingList.readingListReady.should.equal(true);
      $constructedReadingList.should.equal($validReadingList);
    });

    it('fails with an error when an jquery element selection is empty', function () {
      var $readingList = $();

      expect($readingList.readingList).to.throw(Error);
      expect($readingList.readingListReady).to.not.exist;
    });

    it('fails with an error when reading list element is missing an items container', function () {
      var $readingList = $('<div></div>');

      expect($readingList.readingList).to.throw(Error);
      expect($readingList.readingListReady).to.not.exist;
    });
  });

  describe('events', function () {
// TODO : don't forget to check all the done, fail, always logic


    it('should fire an event when at the top of the list', function () {
      var url = '/something/something';
      var firedCallback = false;

      var doGET = sinon.stub($, 'get');
      var deferred = $.Deferred();
      deferred.resolve();
      doGET.returns(deferred.promise());

      $validReadingList.append('<div href="' + url + '" style="height: 500px"></div>');

      $validReadingList.on('reading-list-at-top', function () {
        firedCallback = true;
      });

      $validReadingList.readingList();

      doGET.restore();

      firedCallback.should.equal(true);
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
      $validReadingList.readingList();

      expect($validReadingList.iscrollRef).to.exist;
    });
  });

});
