# Reading List
[![Bower version](https://badge.fury.io/bo/reading-list.svg)](http://badge.fury.io/bo/reading-list)

Why navigate when you don't have to?


## Setup

Include the CSS and JS you need to make this run:
```html
<link rel="stylesheet" type="text/css" href="jquery.reading-list.css">
<script src="jquery.reading-list.js"></script>
```

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
        <div id="article-1-slug" class="reading-list-item" data-href="/article/article-1-slug">
          <div class="reading-list-loader">Up next My First Article!...</div>
        </div>
        <div id="article-2-slug" class="reading-list-item" data-href="/article/article-2-slug">
          <div class="reading-list-loader">Up next My SECOND Article!...</div>
        </div>
        <div id="article-3-slug" class="reading-list-item" data-href="/article/article-3-slug">
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
    lookingThresholdTop: 200,
    lookingThresholdBottom: 250,
    dataRetrievalSuccess: function ($item, data) { return data; },
    dataRetrievalFail: function ($item) { return 'fail!'; }
  });
});
```

As the user scrolls down, article content will be loaded according to the ```data-href```
attribute on each reading list item. Items are marked in the mini-map as active
based on the id of the reading list item which should match with the data-item-ref.

Whatever contents are inside of the reading list item, which in this example case is
```html
<div class="reading-list-loader">Some text...</div>
```
will be replaced by the

### Options
Following is a breakdown of the options available for this plugin:

| Option | Notes |
|--------:|:-------|
| loadingThreshold | Height from the bottom of scrolling container to start loading. |
| lookingThresholdTop | Top boundary of "looking" area, measured from top of window. |
| lookingingThresholdBottom | Bottom boundary of "looking" area, measured from top of window. |
| eventingDebounce | Time in ms to delay eventing execution on scroll. Use larger browsers when considering slower browsers so that scrolling isn't affected by event triggering. |
| scrollToSpeed | Time in ms for scroll to event when scrolling to an article. |
| selectors | Customize the selectors used for each reading list component. Note that whatever classes you choose, the layout of those components must be nested properly. |
| dataRetrievalSuccess | Reading list data transform callback to change received data to HTML. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return the HTML of the reading list item. |
| dataRetrievalFail | Reading list data failure callback. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return HTML of some error message. |

#### Customizing Selectors
The following selectors can be customized as options of the ```selectors``` option:

| Selector Name | Selector Rules |
|--------------:|:---------------|
| scrollContainer | Container that is being scrolled, must be direct child of whatever element the reading list was initialized on. |
| itemsContainer | Direct child of ```scrollContainer```. |
| item | Direct children of ```itemsContainer```, the class used for individual reading list items.  |
| miniMapItems | Selector for mini-map items. |

Note, also, that any styles that come along with the plugin must be applied to the corresponding customized classes here.

### Events
Following are events you can hook into as the page scrolls:

| Name | Arguments | Notes |
|-----:|:----------|:------|
| reading-list-at-top | None | Fires when reading list hits the top. |
| reading-list-at-bottom | None | Fires when reading list hits the bottom. |
| reading-list-at-bottom-load-threshold | None | Triggered when the reading list is nearing the bottom, a threshold specified by ```loadingThreshold``` option. |
| reading-list-start-item-load | ```$item``` ```direction``` | ```$item``` is starting to load, triggered by a scrolling ```direction```. |
| reading-list-item-in-looking | ```$item``` | ```$item``` is the active item. |
| reading-list-item-in-looking | ```$item``` | ```$item``` is no longer the active item. |
| reading-list-item-progress | ```$item``` ```progress``` | Has viewed ```progress``` ratio of the entire ```$item```. Use to update progress bars. To make ```progress``` a percentage, do ```progress * 100```.  |
| reading-list-start-item-load-done | ```$item``` | ```$item``` is done loading. |

All events are triggered on the container used to build the reading list, so in the example, it would be on the ```#readingList``` element.

## Usage Notes

### The "Looking" Area
Whatever the top item is in the reading list that falls within the "looking"
area is what is active and will be marked as such in the mini-map. For the
progress bar, the amount "read" is the distance from the top of the article to
the bottom of the "looking area".

### Preloading Items
Any reading list items that are loaded with the page should have the attribute ```data-load-status="loaded"``` to prevent reloading that item. In order to keep
styling consistent, the item should also get the ```loaded``` CSS class.

## Running the Example
If you'd like to see the example, clone down this code, then:
```bash
$ cd reading-list
$ bower install
$ cd example
$ node web.js
```
