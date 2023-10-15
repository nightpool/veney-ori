Object.defineProperty(Object.prototype, "tap", {
  value: function(f) { f(this); return this; },
  enumerable: false,
});