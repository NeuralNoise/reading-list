## Version 0.2.0
- replaced `settings.scrollToAddPx` with `settings.scrollToSubtractPx`
  The value is now subtracted.

## Version 0.1.0

- using `$.fn.offset()` in favor of `$.fn.position()` to
  calculate element positions

- requires change to reading list implementations

```
SomeReadingList.prototype.scrollToAddPx = function () {
  return - this.$header.outerHeight(true);
};
```

Should return a negative value to add to scrollTop that is equal to
any sticky top header elements heights.
