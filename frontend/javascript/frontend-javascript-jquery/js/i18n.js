(function (w) {
  /** Mirror of `HEADER_LANG_CHANGE` in design-system `js/header.js`. */
  var HEADER_LANG_CHANGE = 'header:lang-change';
  /** Mirror of `LANG_STORAGE_KEY` in design-system `js/header.js`. */
  var LANG_STORAGE_KEY = 'zds-lang';

  // Copied from frontend-typescript-react/src/i18n/{en,ru}.ts — not a shared lib.
  // home.blurb is the only stack-specific line (jquery, not the React SPA / not vanilla).
  var en = {
    nav: {
      home: 'Home',
      login: 'Login',
      register: 'Register',
      stack: 'Stack',
    },
    home: {
      title: 'Multistack',
      blurb: 'jQuery demo — items loaded from {api}.',
      session: 'Session',
      welcome: 'Welcome, {username}!',
      logout: 'Logout',
      deleteAccount: 'Delete account',
      deleteConfirm: 'Delete this account? This cannot be undone.',
      health: 'Health',
      healthChecking: '→ Checking health…',
      healthOk: '→ {status} | service: {service} | frontend: {frontend}',
      healthError: '✗ health: {message}',
      items: 'Items',
      itemsLoading: '→ Loading items…',
      itemsEmpty: 'No items found.',
      itemsError: '✗ items: {message}',
    },
    login: {
      title: 'Login Form',
      loginLabel: 'Login',
      passwordLabel: 'Password',
      submit: 'Login',
      noAccount: 'No account?',
      registerLink: 'Register',
      errorWrongCredentials: 'Wrong login or password',
    },
    register: {
      title: 'Register',
      loginLabel: 'Login',
      passwordLabel: 'Password',
      confirmLabel: 'Confirm',
      submit: 'Register',
      haveAccount: 'Already have an account?',
      loginLink: 'Login',
      errorPasswordMismatch: 'Passwords do not match',
      errorRegistrationFailed: 'Registration failed',
    },
    auth: {
      errorBothRequired:
        'Login and password are required (minimum {minLogin} and {minPassword} characters)',
      errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
      errorLoginMinLength: 'Login must be at least {minLogin} characters',
      errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
      errorPasswordMinLength: 'Password must be at least {minPassword} characters',
      errorNetwork: 'Network error. Check your connection and try again.',
    },
  };

  var ru = {
    nav: {
      home: 'Главная',
      login: 'Вход',
      register: 'Регистрация',
      stack: 'Стек',
    },
    home: {
      title: 'Multistack',
      blurb: 'Демо jQuery — элементы из {api}.',
      session: 'Сессия',
      welcome: 'Добро пожаловать, {username}!',
      logout: 'Выйти',
      deleteAccount: 'Удалить аккаунт',
      deleteConfirm: 'Удалить этот аккаунт? Это нельзя отменить.',
      health: 'Статус',
      healthChecking: '→ Проверка статуса…',
      healthOk: '→ {status} | сервис: {service} | фронтенд: {frontend}',
      healthError: '✗ статус: {message}',
      items: 'Элементы',
      itemsLoading: '→ Загрузка элементов…',
      itemsEmpty: 'Элементы не найдены.',
      itemsError: '✗ элементы: {message}',
    },
    login: {
      title: 'Форма входа',
      loginLabel: 'Логин',
      passwordLabel: 'Пароль',
      submit: 'Войти',
      noAccount: 'Нет аккаунта?',
      registerLink: 'Регистрация',
      errorWrongCredentials: 'Неверный логин или пароль',
    },
    register: {
      title: 'Регистрация',
      loginLabel: 'Логин',
      passwordLabel: 'Пароль',
      confirmLabel: 'Подтверждение',
      submit: 'Зарегистрироваться',
      haveAccount: 'Уже есть аккаунт?',
      loginLink: 'Войти',
      errorPasswordMismatch: 'Пароли не совпадают',
      errorRegistrationFailed: 'Регистрация не удалась',
    },
    auth: {
      errorBothRequired: 'Нужны логин и пароль (минимум {minLogin} и {minPassword} символов)',
      errorLoginRequired: 'Логин обязателен (минимум {minLogin} символов)',
      errorLoginMinLength: 'Логин должен быть не короче {minLogin} символов',
      errorPasswordRequired: 'Пароль обязателен (минимум {minPassword} символов)',
      errorPasswordMinLength: 'Пароль должен быть не короче {minPassword} символов',
      errorNetwork: 'Ошибка сети. Проверьте соединение и попробуйте снова.',
    },
  };

  var dictionaries = { en: en, ru: ru };

  function isLang(value) {
    return value === 'en' || value === 'ru';
  }

  function langFromDetail(lang) {
    return lang === 'ru' ? 'ru' : 'en';
  }

  function readStoredLang() {
    try {
      var stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(stored)) {
        return stored;
      }
    } catch (e) {
      // private mode / blocked storage
    }
    return 'en';
  }

  function applyDocumentLang(lang) {
    document.documentElement.lang = langFromDetail(lang);
  }

  function lookup(dict, path) {
    return String(path || '')
      .split('.')
      .reduce(function (acc, key) {
        return acc == null ? acc : acc[key];
      }, dict);
  }

  function applyDataI18n(copy) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = lookup(copy, el.getAttribute('data-i18n'));
      if (typeof value === 'string') {
        el.textContent = value;
      }
    });
  }

  function loginMessages(lang) {
    var copy = dictionaries[langFromDetail(lang)];
    return Object.assign({}, copy.auth, {
      errorWrongCredentials: copy.login.errorWrongCredentials,
    });
  }

  function registerMessages(lang) {
    var copy = dictionaries[langFromDetail(lang)];
    return Object.assign({}, copy.auth, {
      errorPasswordMismatch: copy.register.errorPasswordMismatch,
      errorRegistrationFailed: copy.register.errorRegistrationFailed,
    });
  }

  w.I18n = {
    HEADER_LANG_CHANGE: HEADER_LANG_CHANGE,
    LANG_STORAGE_KEY: LANG_STORAGE_KEY,
    dictionaries: dictionaries,
    en: en,
    ru: ru,
    isLang: isLang,
    langFromDetail: langFromDetail,
    readStoredLang: readStoredLang,
    applyDocumentLang: applyDocumentLang,
    lookup: lookup,
    applyDataI18n: applyDataI18n,
    loginMessages: loginMessages,
    registerMessages: registerMessages,
  };
})(window);
