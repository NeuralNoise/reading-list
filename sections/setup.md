---
---

## Setup

Include the CSS and JS you need to make this run:
{% highlight html %}
<link rel="stylesheet" type="text/css" href="jquery.reading-list.css">
<script src="jquery.reading-list.js"></script>
{% endhighlight %}

Make your HTML like this:
{% highlight html %}
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
{% endhighlight %}

Then make your JS like this:
{% highlight javascript %}
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
{% endhighlight %}

As the user scrolls down, article content will be loaded according to the ```data-href```
attribute on each reading list item. Items are marked in the mini-map as active
based on the id of the reading list item which should match with the data-item-ref.

Whatever contents are inside of the reading list item, which in this example case is
{% highlight html %}
<div class="reading-list-loader">Some text...</div>
{% endhighlight %}
will be replaced by the content returned by the AJAX call.
