(function (w) {
  // Path matrix: /stack/{backend}/{frontend}/ (canonical) or legacy /{backend}/{frontend}/.
  var stackPair = w.location.pathname.match(
    /^\/stack\/(backend-[^/]+)\/(frontend[-_][a-z0-9_-]+)/,
  );
  var legacyPair = w.location.pathname.match(
    /^\/(backend-[^/]+)\/(frontend[-_][a-z0-9_-]+)/,
  );
  var stackFe = w.location.pathname.match(/^\/stack\/(frontend[-_][a-z0-9_-]+)/);
  var legacyFe = w.location.pathname.match(/^(\/frontend[-_][a-z0-9_-]+)/);

  w.UI_MOUNT = 'frontend-javascript-vanilla';

  if (stackPair) {
    w.BACKEND_ID = stackPair[1];
    w.UI_MOUNT = stackPair[2];
    w.APP_BASE = '/stack/' + stackPair[1] + '/' + stackPair[2];
    w.API_BASE = '/stack/' + stackPair[1] + '/api';
  } else if (legacyPair) {
    w.BACKEND_ID = legacyPair[1];
    w.UI_MOUNT = legacyPair[2];
    w.APP_BASE = '/' + legacyPair[1] + '/' + legacyPair[2];
    w.API_BASE = '/' + legacyPair[1] + '/api';
  } else if (stackFe) {
    w.BACKEND_ID = null;
    w.UI_MOUNT = stackFe[1];
    w.APP_BASE = '/stack/' + stackFe[1];
    w.API_BASE = '/stack/backend-java-spring/api';
  } else if (legacyFe) {
    w.BACKEND_ID = null;
    w.UI_MOUNT = legacyFe[1].slice(1);
    w.APP_BASE = legacyFe[1];
    w.API_BASE = '/api';
  } else if (String(w.location.pathname || '').indexOf('/stack') === 0) {
    w.BACKEND_ID = null;
    w.APP_BASE = '/stack';
    w.API_BASE = '/stack/backend-java-spring/api';
  } else {
    w.BACKEND_ID = null;
    w.APP_BASE = '';
    w.API_BASE = '/api';
  }

  w.appPath = function (path) {
    var p = path == null || path === '' ? '/' : String(path);
    if (p.charAt(0) !== '/') p = '/' + p;
    return w.APP_BASE + p;
  };

  w.apiUrl = function (path) {
    var p = path == null || path === '' ? '' : String(path);
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.indexOf('/api/') === 0) p = p.slice(4);
    else if (p === '/api') p = '';
    return w.API_BASE + p;
  };
})(window);
