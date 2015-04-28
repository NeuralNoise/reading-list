---
---

## Usage Notes

### The "Looking" Area
Whatever the top item is in the reading list that falls within the "looking"
area is what is active and will be marked as such in the mini-map. For the
progress bar, the amount "read" is the distance from the top of the article to
the bottom of the "looking area".

### Preloading Items
Any reading list items that are loaded with the page should have the attribute ```data-load-status="loaded"``` to prevent reloading that item. In order to keep
styling consistent, the item should also get the ```loaded``` CSS class.

### Refreshing IScroll
Whenever code external to the reading list plugin will change the layout of the
reading list, such as modifying show/hide or size, an event should be triggered.
This event name should then be listed in the ```refreshIScrollOn``` option array
so that the plugin can refresh iScroll when this event occurs in a mobile
environment.
