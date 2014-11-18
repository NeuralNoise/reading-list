# Reading List

Why navigate when you don't have to?

## Setup

Make your HTML like this:
```html
<div id="readingList">
  <div class="reading-list-left-nav">
    <ul class="reading-list-mini-map">
      <li class="reading-list-mini-map-item" data-item-ref="article-1-slug">
        <span class="nav-viewing-indicator">&#x2713;</span>
        <a href="/article/article-1-slug">My First Article!</a>
      </li>
      <li class="reading-list-mini-map-item" data-item-ref="article-2-slug">
        <span class="nav-viewing-indicator">&#x2713;</span>
        <a href="/article/article-2-slug">My SECOND Article!</a>
      </li>
      <li class="reading-list-mini-map-item" data-item-ref="article-3-slug">
        <span class="nav-viewing-indicator">&#x2713;</span>
        <a href="/article/article-3-slug">This Is The Last Article :(!</a>
      </li>
    </ul>
  </div>
  <div class="reading-list-content">
    <div class="reading-list-items">
        <div class="reading-list-item"
          data-href="/article/article-1-slug">
          <div class="reading-list-loader">Up next My First Article!...</div>
        </div>
        <div class="reading-list-item"
          data-href="/article/article-2-slug">
          <div class="reading-list-loader">Up next My SECOND Article!...</div>
        </div>
        <div class="reading-list-item"
          data-href="/article/article-3-slug">
          <div class="reading-list-loader">Up next This Is The Last Article :(!...</div>
        </div>
    </div>
  </div>
</div>
```

Then make your JS like this:
```javascript
$(document).on('ready', function () {
  // initialize reading list
  $('#readingList').readingList({
    loadingThreshold: 300,
    viewingThresholdTop: 200,
    viewingThresholdBottom: 250,
    dataRetrievalCallback: function (data) { return data; }
  });
});
```

As the user scrolls down, article content will be loaded according to the ```data-href```
attribute on each reading list item.

### Options
Following is a breakdown of the options available for this plugin:

| Option | Notes |
|--------:|:-------|
| loadingThreshold | Height from the bottom of scrolling container to start loading. |
| viewingThresholdTop | Top boundary of "looking" area, measured from top of window. |
| viewingThresholdBottom | Bottom boundary of "looking" area, measured from top of window. |
| dataRetrievalCallback | Reading list data transform callback to change received data to HTML. |

As an additional note, whatever the top item is in the reading list that falls within
the "looking" area is what is active and will be marked as such in the mini-map.
