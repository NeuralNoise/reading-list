---
---

### Options
Following is a breakdown of the options available for this plugin:

| Option | Notes |
|--------:|:-------|
| ```loadingThreshold``` | Height from the bottom of scrolling container to start loading. |
| ```lookingThresholdTop``` | Top boundary of "looking" area, measured from top of window. |
| ```lookingThresholdBottom``` | Bottom boundary of "looking" area, measured from top of window. |
| ```eventingThrottle``` | Time in ms to delay eventing execution on scroll. Use larger values when considering slower browsers so that scrolling isn't affected by event triggering. |
| ```scrollToSpeed``` | Time in ms for scroll to event when scrolling to an article. |
| ```selectors``` | Customize the selectors used for each reading list component. Note that whatever classes you choose, the layout of those components must be nested properly. |
| ```addContent``` | Define this content to add content to the end of the reading list when there are no more items to load. Expected to return a promise that will resolve with the content to append to the end of the list. |
| ```refreshIScrollOn``` | A list of event names that, when triggered, will change the display of the reading list (such as show/hide). This will allow the plugin to detect when these events occur and refresh the iScroll container. |
| ```dataRetrievalSuccess``` | Reading list data transform callback to change received data to HTML. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return the HTML of the reading list item. |
| ```dataRetrievalFail``` | Reading list data failure callback. Non-falsy return values from this function will replace the contents of the reading list item. In the ideal case, this function will return HTML of some error message. |
| ```scrollContainerHeight``` | Set this to use a custom value for scroll container height in calculations, should be a function that returns an integer which is the height of the container being scrolled. Needed in cases, like were reading list is entire document and the window should be used for height calculations vs. document height. |
| ```scrollTotalHeight``` | Set this to use a custom value for scroll total height in calculations. Should be a function that returns an integer which is the total scrollable height of the scroll container. Needed in cases such as when the reading list is entire document and the body should be used for scroll total height calculations. |
| ```scrollAnimationContainer``` | Set this to use a custom container for scrolling animation. A jQuery object that encapsulates the element that scrolling will occur on. Needed in cases such as when the reading list is entire document and the body should be used for scroll animations. |
| ```noEventBubbling```| Set to true to stop events from bubbling up the DOM tree, in which case, any event listeners must attach to the reading list element itself. This **must** be set to true for any reading lists that are nested inside another reading list! |
| ```onReady``` | Set to a function that will fire when the reading list is ready. Reading list object will be passed in as first argument. |

#### Customizing Selectors
The following selectors can be customized as options of the ```selectors``` option:

| Selector Name | Selector Rules |
|--------------:|:---------------|
| ```itemsContainer``` | Direct child of element used to create reading list. |
| ```items``` | Direct children of ```itemsContainer```, the class used for individual reading list items.  |
| ```miniMapItems``` | Selector for mini-map elements. Minimap elements can be anywhere on the page as long as they can be selected with this selector and have the ```data-item-ref``` attribute. If you are using multiple reading lists on a single page, this selector should be customized for each individual instance of a reading list. |

Note, also, that any styles that come along with the plugin must be applied to the corresponding customized classes here.
