(function (w) {
  // Hyphen between segments (SSOT); keep underscore form for legacy mounts.
  var match = w.location.pathname.match(/^(\/frontend[-_][a-z0-9_-]+)/);
  w.APP_BASE = match ? match[1] : "";
  w.appPath = function (path) {
    var p = path == null || path === "" ? "/" : String(path);
    if (p.charAt(0) !== "/") p = "/" + p;
    return w.APP_BASE + p;
  };
})(window);
