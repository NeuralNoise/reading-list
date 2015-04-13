
describe('Reading list', function () {

  it('should initialize via a selected jquery element', function () {

    var $readingList = $(
      '<div>' +
        '<div class="reading-list-items"></div>' +
      '</div>'
    );

    $readingList.readingList();

    $readingList.readingListReady.should.equal(true);
  });

  it('should not initialize when an jquery element selection is empty', function () {

// TODO : fill this in
  throw new Error('Not implemented yet.');
  });

  it('should not initialize when reading list element is missing an items container', function () {

// TODO : fill this in
    throw new Error('Not implemented yet.');
  });

});
