(function (w) {
  /** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
  var STACK_INDEX_HREF = '/stack/';

  function navLabelsKey(config) {
    return ((config && config.nav) || [])
      .map(function (item) {
        return item.label;
      })
      .join('\0');
  }

  /**
   * Nav labels follow the page dictionary; testids and hrefs stay stable.
   * Omit `active` — header.js derives it from location.
   * Theme stays in header.js (`zds-theme`); this only retitles nav.
   */
  function buildHeaderConfig(lang) {
    var nav = I18n.dictionaries[I18n.langFromDetail(lang)].nav;
    var envItems = typeof w.envNavItems === 'function' ? w.envNavItems() : [];
    return {
      brand: { href: appPath('/'), label: 'Multistack' },
      nav: [
        { href: appPath('/'), label: nav.home, testid: 'header-nav-home' },
        { href: appPath('/login'), label: nav.login, testid: 'header-nav-login' },
        { href: appPath('/register'), label: nav.register, testid: 'header-nav-register' },
        { href: STACK_INDEX_HREF, label: nav.stack, testid: 'header-nav-stack' },
      ].concat(envItems),
      lang: { default: 'en' },
      theme: { default: 'dark' },
    };
  }

  function syncHeaderNav(config, previousKey) {
    w.headerConfig = config;
    var next = navLabelsKey(config);
    if (previousKey !== null && previousKey !== next && typeof w.__designSystemRemountHeader === 'function') {
      w.__designSystemRemountHeader();
    }
    return next;
  }

  function startI18n(applyCopy) {
    var navKey = navLabelsKey(w.headerConfig);
    function apply(lang) {
      var code = I18n.langFromDetail(lang);
      var copy = I18n.dictionaries[code];
      I18n.applyDocumentLang(code);
      navKey = syncHeaderNav(buildHeaderConfig(code), navKey);
      I18n.applyDataI18n(copy);
      if (typeof applyCopy === 'function') {
        applyCopy(copy, code);
      }
    }
    document.addEventListener(I18n.HEADER_LANG_CHANGE, function (event) {
      apply(event.detail && event.detail.lang);
    });
    apply(I18n.readStoredLang());
  }

  w.STACK_INDEX_HREF = STACK_INDEX_HREF;
  w.buildHeaderConfig = buildHeaderConfig;
  w.syncHeaderNav = syncHeaderNav;
  w.startI18n = startI18n;
})(window);
