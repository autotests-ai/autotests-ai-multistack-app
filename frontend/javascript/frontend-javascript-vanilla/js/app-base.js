(function (w) {
  // Path matrix: /{backend}/{frontend}/ — shared dist × N backends.
  var match = w.location.pathname.match(/^\/(backend-[^/]+)\/(frontend[-_][a-z0-9_-]+)/);
  /** Product mount id (= matrix frontend.mount). */
  w.UI_MOUNT = "frontend-javascript-vanilla";
  if (match) {
    w.BACKEND_ID = match[1];
    w.UI_MOUNT = match[2];
    w.APP_BASE = "/" + match[1] + "/" + match[2];
    w.API_BASE = "/" + match[1] + "/api";
  } else {
    // Legacy / vite-less open of /frontend-* only
    var fe = w.location.pathname.match(/^(\/frontend[-_][a-z0-9_-]+)/);
    w.BACKEND_ID = null;
    if (fe) w.UI_MOUNT = fe[1].slice(1);
    w.APP_BASE = fe ? fe[1] : "";
    w.API_BASE = "/api";
  }
  w.appPath = function (path) {
    var p = path == null || path === "" ? "/" : String(path);
    if (p.charAt(0) !== "/") p = "/" + p;
    return w.APP_BASE + p;
  };
  w.apiUrl = function (path) {
    var p = path == null || path === "" ? "" : String(path);
    if (p.charAt(0) !== "/") p = "/" + p;
    if (p.indexOf("/api/") === 0) p = p.slice(4);
    else if (p === "/api") p = "";
    return w.API_BASE + p;
  };
})(window);
