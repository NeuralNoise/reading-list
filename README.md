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
<div class="reading-list-left-nav"> <!-- Minimap container -->
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
<div class="reading-list-content"> <!-- Reading list initialized on this element -->
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
```

Then make your JS like this:
```javascript
$(document).on('ready', function () {
  // initialize reading list
  $('.reading-list-content').readingList({
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
will be replaced by the content returned by the AJAX call.

### Options
Following is a breakdown of the options available for this plugin:

| Option | Notes |
|--------:|:-------|
| `addContent` | Define this content to add content to the end of the reading list when there are no more items to load. Expected to return a promise that will resolve with the content to append to the end of the list. |
| `dataRetrievalFail` | Reading list data failure callback. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return HTML of some error message. |
| `dataRetrievalSuccess` | Reading list data transform callback to change received data to HTML. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return the HTML of the reading list item. |
| `eventingThrottle` | Time in ms to delay eventing execution on scroll. Use larger values when considering slower browsers so that scrolling isn't affected by event triggering. |
| `isMobile` | A value that determines if the user is currently on a mobile device, used for changing reading list behaviors depending on how the reading list is being viewed. Either a function that returns a boolean, or a constant boolean value. |
| `loadingThreshold` | Height from the bottom of scrolling container to start loading. Either a function that returns a number or a constant number value. |
| `lookingThresholdBottom` | Bottom boundary of "looking" area, measured from top of window. |
| `lookingThresholdTop` | Top boundary of "looking" area, measured from top of window. Either a function that returns a number or a constant number value. |
| `miniMapActiveClass` | Class to apply to active minimap items. |
| `noEventBubbling` | Set to true to stop events from bubbling up the DOM tree, in which case, any event listeners must attach to the reading list element itself. This **must** be set to true for any reading lists that are nested inside another reading list! |
| `onPreSetup` | Set to a function that will fire before reading list is setup and initial eventing and loading is done. Reading list object will be passed in as first argument. |
| `onReady` | Set to a function that will fire when the reading list is ready and initial eventing and loading has been done. Reading list object will be passed in as first argument. |
| `scrollContainer` | Container that is used for scrolling. Customize this only if using a non-element--such as window, body, document, html--for scrolling. |
| `scrollToAddPx` | Number, or function that returns a number, to add to scroll to distance. Useful if some absolute position element (such as a sticky header) needs to be accounted for when scrolling to an item. |
| `scrollToSpeed` | Time in ms for scroll to event when scrolling to an article. |
| `selectorsItems` | Direct children of `itemsContainer`, the class used for individual reading list items. |
| `selectorsItemsContainer` | Direct child of element used to create reading list. |
| `selectorsItemsPreLoaded` | Filter selector for `selectorsItems` that distinguishes items that have already been loaded into the reading list before reading list initialization. |
| `selectorsMiniMapItems` | Selector for mini-map elements. Minimap elements can be anywhere on the page as long as they can be selected with this selector and have the `data-item-ref` attribute. If you are using multiple reading lists on a single page, this selector should be customized for each individual instance of a reading list. |

Note, that any styles that come along with the plugin must be applied to the corresponding customized classes here.

### Events
Following are events you can hook into as the page scrolls. Note: all events are triggered on the container used to build the reading list, so in the example, it would be on the ```#readingList``` element.

#### Reading List Events
Events applicable to the state of the entire reading list. No arguments are given
to event callbacks.

| Name | Notes |
|-----:|:----------|:------|
| ```reading-list-at-top``` | Fires when reading list hits the top. |
| ```reading-list-out-of-content``` | Reading list has run out of content. Internally, if ```addContent``` is defined it will be used when this event triggers to add new content to the end of the reading list. |

#### Item Events
Events applicable to individual reading list items. Note that:
1. All event callbacks are given the ```$item``` the event is for as the first
argument.
2. The ```Arguments``` listed are keys of the second argument into the callback.
3. ```callCount``` refers to the number of times the given event has been
triggered on that item.

| Name | Arguments | Notes |
|-----:|:----------|:------|
| ```reading-list-item-load-start``` | ```callCount``` ```direction``` | ```$item``` is starting to load, triggered by a scrolling ```direction```. |
| ```reading-list-item-load-done``` | ```callCount``` | ```$item``` is done loading. |
| ```reading-list-item-in-looking``` | ```callCount``` | ```$item``` has entered the looking area and is the active item. |
| ```reading-list-item-out-looking``` | ```callCount``` | ```$item``` has fallen out of the looking area and is no longer the active item. |
| ```reading-list-item-progress``` | ```progress``` | Has viewed ```progress``` ratio of the entire ```$item```. Use to update progress bars. To make ```progress``` a percentage, do ```progress * 100```.  |
| ```reading-list-start-scroll-to```| None |```$item``` is being scrolled into view.|
| ```reading-list-end-scroll-to```| None |```$item``` has been scrolled into view.|

## Usage Notes

### The "Looking" Area
Whatever the top item is in the reading list that falls within the "looking"
area is what is active and will be marked as such in the mini-map. For the
progress bar, the amount "read" is the distance from the top of the article to
the bottom of the "looking area".

### Preloading Items
Any reading list items that are loaded with the page should have the attribute ```data-load-status="loaded"``` to prevent reloading that item. In order to keep
styling consistent, the item should also get the ```loaded``` CSS class.

## Development

### Running the Example
```bash
$ npm run example
```

### Run tests
```bash
$ npm run test
```

### Creating a New Build
```bash
$ npm run build
```
