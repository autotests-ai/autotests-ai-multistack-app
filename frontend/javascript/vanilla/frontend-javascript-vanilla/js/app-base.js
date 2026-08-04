(function (w) {
  var match = w.location.pathname.match(/^(\/frontend_[a-z0-9_]+)/);
  w.APP_BASE = match ? match[1] : "";
  w.appPath = function (path) {
    var p = path == null || path === "" ? "/" : String(path);
    if (p.charAt(0) !== "/") p = "/" + p;
    return w.APP_BASE + p;
  };
})(window);
