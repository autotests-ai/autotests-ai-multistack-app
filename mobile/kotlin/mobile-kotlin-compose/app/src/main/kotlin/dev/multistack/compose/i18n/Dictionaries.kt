package dev.multistack.compose.i18n

/**
 * Mirrors `frontend-typescript-react/src/i18n/{en,ru}.ts` minus the note/items
 * copy this cell does not ship. Keys and wording stay identical so one Appium
 * suite can assert the same strings on web, Android and iOS — except
 * `home.title`, which is the native brand `QA.GURU` (header + launcher).
 */
enum class Lang(val code: String) {
    EN("en"),
    RU("ru"),
    ;

    fun other(): Lang = if (this == EN) RU else EN
}

data class NavCopy(
    val home: String,
    val login: String,
    val register: String,
    val stack: String,
)

data class HomeCopy(
    val title: String,
    val blurb: String,
    val session: String,
    val welcome: String,
    val logout: String,
    val deleteAccount: String,
    val deleteConfirm: String,
    val deleteConfirmOk: String,
    val deleteConfirmCancel: String,
    val health: String,
    val healthChecking: String,
    val healthOk: String,
    val healthError: String,
)

data class LoginCopy(
    val title: String,
    val loginLabel: String,
    val passwordLabel: String,
    val submit: String,
    val noAccount: String,
    val registerLink: String,
    val errorWrongCredentials: String,
)

data class RegisterCopy(
    val title: String,
    val loginLabel: String,
    val passwordLabel: String,
    val confirmLabel: String,
    val submit: String,
    val haveAccount: String,
    val loginLink: String,
    val errorPasswordMismatch: String,
    val errorRegistrationFailed: String,
)

data class AuthCopy(
    val errorBothRequired: String,
    val errorLoginRequired: String,
    val errorLoginMinLength: String,
    val errorPasswordRequired: String,
    val errorPasswordMinLength: String,
    val errorNetwork: String,
)

data class HeaderCopy(
    val searchPlaceholder: String,
    val menuLabel: String,
    val switchToDark: String,
    val switchToLight: String,
    val switchLang: String,
)

data class Dictionary(
    val nav: NavCopy,
    val home: HomeCopy,
    val login: LoginCopy,
    val register: RegisterCopy,
    val auth: AuthCopy,
    val header: HeaderCopy,
)

private val EN = Dictionary(
    nav = NavCopy(home = "Home", login = "Login", register = "Register", stack = "Stack"),
    home = HomeCopy(
        title = "QA.GURU",
        blurb = "Kotlin Compose native app — session from {api}.",
        session = "Session",
        welcome = "Welcome, {username}!",
        logout = "Logout",
        deleteAccount = "Delete account",
        deleteConfirm = "Delete this account? This cannot be undone.",
        deleteConfirmOk = "Delete",
        deleteConfirmCancel = "Cancel",
        health = "Health",
        healthChecking = "→ Checking health…",
        healthOk = "→ {status} | service: {service} | frontend: {frontend}",
        healthError = "✗ health: {message}",
    ),
    login = LoginCopy(
        title = "Login Form",
        loginLabel = "Login",
        passwordLabel = "Password",
        submit = "Login",
        noAccount = "No account?",
        registerLink = "Register",
        errorWrongCredentials = "Wrong login or password",
    ),
    register = RegisterCopy(
        title = "Register",
        loginLabel = "Login",
        passwordLabel = "Password",
        confirmLabel = "Confirm",
        submit = "Register",
        haveAccount = "Already have an account?",
        loginLink = "Login",
        errorPasswordMismatch = "Passwords do not match",
        errorRegistrationFailed = "Registration failed",
    ),
    auth = AuthCopy(
        errorBothRequired =
            "Login and password are required (minimum {minLogin} and {minPassword} characters)",
        errorLoginRequired = "Login is required (minimum {minLogin} characters)",
        errorLoginMinLength = "Login must be at least {minLogin} characters",
        errorPasswordRequired = "Password is required (minimum {minPassword} characters)",
        errorPasswordMinLength = "Password must be at least {minPassword} characters",
        errorNetwork = "Network error. Check your connection and try again.",
    ),
    header = HeaderCopy(
        searchPlaceholder = "Поиск",
        menuLabel = "Меню",
        switchToDark = "Switch to dark theme",
        switchToLight = "Switch to light theme",
        switchLang = "Switch to Russian",
    ),
)

private val RU = Dictionary(
    nav = NavCopy(home = "Главная", login = "Вход", register = "Регистрация", stack = "Стек"),
    home = HomeCopy(
        title = "QA.GURU",
        blurb = "Нативное приложение Kotlin Compose — сессия из {api}.",
        session = "Сессия",
        welcome = "Добро пожаловать, {username}!",
        logout = "Выйти",
        deleteAccount = "Удалить аккаунт",
        deleteConfirm = "Удалить этот аккаунт? Это нельзя отменить.",
        deleteConfirmOk = "Удалить",
        deleteConfirmCancel = "Отмена",
        health = "Статус",
        healthChecking = "→ Проверка статуса…",
        healthOk = "→ {status} | сервис: {service} | фронтенд: {frontend}",
        healthError = "✗ статус: {message}",
    ),
    login = LoginCopy(
        title = "Форма входа",
        loginLabel = "Логин",
        passwordLabel = "Пароль",
        submit = "Войти",
        noAccount = "Нет аккаунта?",
        registerLink = "Регистрация",
        errorWrongCredentials = "Неверный логин или пароль",
    ),
    register = RegisterCopy(
        title = "Регистрация",
        loginLabel = "Логин",
        passwordLabel = "Пароль",
        confirmLabel = "Подтверждение",
        submit = "Зарегистрироваться",
        haveAccount = "Уже есть аккаунт?",
        loginLink = "Войти",
        errorPasswordMismatch = "Пароли не совпадают",
        errorRegistrationFailed = "Регистрация не удалась",
    ),
    auth = AuthCopy(
        errorBothRequired = "Нужны логин и пароль (минимум {minLogin} и {minPassword} символов)",
        errorLoginRequired = "Логин обязателен (минимум {minLogin} символов)",
        errorLoginMinLength = "Логин должен быть не короче {minLogin} символов",
        errorPasswordRequired = "Пароль обязателен (минимум {minPassword} символов)",
        errorPasswordMinLength = "Пароль должен быть не короче {minPassword} символов",
        errorNetwork = "Ошибка сети. Проверьте соединение и попробуйте снова.",
    ),
    header = HeaderCopy(
        searchPlaceholder = "Поиск",
        menuLabel = "Меню",
        switchToDark = "Switch to dark theme",
        switchToLight = "Switch to light theme",
        // `setLangState` in js/header.js keeps this string Russian-side.
        switchLang = "Переключить на English",
    ),
)

val dictionaries: Map<Lang, Dictionary> = mapOf(Lang.EN to EN, Lang.RU to RU)

fun dictionary(lang: Lang): Dictionary = dictionaries.getValue(lang)

/**
 * `lib/auth.ts` `formatMessage` — `{key}` placeholders, missing key → "".
 * Both braces are escaped: Android's ICU regex engine rejects a bare `}`.
 */
private val PLACEHOLDER = Regex("\\{(\\w+)\\}")

fun formatMessage(template: String, values: Map<String, Any>): String =
    PLACEHOLDER.replace(template) { match ->
        values[match.groupValues[1]]?.toString() ?: ""
    }
