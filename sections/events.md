---
---

### Events
Following are events you can hook into as the page scrolls. Note: all events are triggered on the container used to build the reading list, so in the example, it would be on the ```#readingList``` element.

#### Reading List Events
Events applicable to the state of the entire reading list:

| Name | Arguments | Notes |
|-----:|:----------|:------|
| ```reading-list-at-top``` | None | Fires when reading list hits the top. |
| ```reading-list-at-bottom``` | None | Fires when reading list hits the bottom. |
| ```reading-list-at-bottom-load-threshold``` | None | Triggered when the reading list is nearing the bottom, a threshold specified by ```loadingThreshold``` option. |
| ```reading-list-out-of-content``` | None | Reading list has run out of content. Internally, if ```addContent``` is defined it will be used when this event triggers to add new content to the end of the reading list. |

#### Item Events
Events applicable to individual reading list items:

| Name | Arguments | Notes |
|-----:|:----------|:------|
| ```reading-list-start-item-load``` | ```$item``` ```direction``` | ```$item``` is starting to load, triggered by a scrolling ```direction```. |
| ```reading-list-item-in-looking``` | ```$item``` | ```$item``` has entered the looking area and is the active item. |
| ```reading-list-item-out-looking``` | ```$item``` | ```$item``` has fallen out of the looking area and is no longer the active item. |
| ```reading-list-item-progress``` | ```$item``` ```progress``` | Has viewed ```progress``` ratio of the entire ```$item```. Use to update progress bars. To make ```progress``` a percentage, do ```progress * 100```.  |
| ```reading-list-start-item-load-done``` | ```$item``` | ```$item``` is done loading. |
