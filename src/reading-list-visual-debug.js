
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

  var $addVisualRule = function (top, isAbsolute, color) {
    var $rule = $('<hr>');

    $rule
      .css('border-top', '1px solid ' + color)
      .css('bottom', 0)
      .css('margin', 0)
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
    var bounds = $item[0].getBoundingClientRect();

    $addVisualRule(bounds.top, true, 'blue');
    $addVisualRule(bounds.bottom, true, 'blue');
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
      $addVisualRule(readingList.settings.lookingThresholdTop, false, 'red');
      $addVisualRule(readingList.settings.lookingThresholdBottom, false, 'red');

      readingList.$container.on('reading-list-item-in-looking', setActiveItemIndicator);
      readingList.$container.on('reading-list-item-out-looking', setActiveItemIndicator);
      readingList.$container.on('reading-list-item-load-done', setItemDebug);

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
