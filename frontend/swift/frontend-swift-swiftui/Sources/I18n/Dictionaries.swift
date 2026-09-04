import Foundation

/// Mirrors `frontend-typescript-react/src/i18n/{en,ru}.ts` minus the note/items
/// copy this cell does not ship. Keys and wording stay identical to the Compose
/// cell so one Appium suite can assert the same strings everywhere.
enum Lang: String {
    case en
    case ru

    var other: Lang { self == .en ? .ru : .en }
}

struct NavCopy {
    let home: String
    let login: String
    let register: String
    let stack: String
}

struct HomeCopy {
    let title: String
    let blurb: String
    let session: String
    let welcome: String
    let logout: String
    let deleteAccount: String
    let deleteConfirm: String
    let deleteConfirmOk: String
    let deleteConfirmCancel: String
    let health: String
    let healthChecking: String
    let healthOk: String
    let healthError: String
}

struct LoginCopy {
    let title: String
    let loginLabel: String
    let passwordLabel: String
    let submit: String
    let noAccount: String
    let registerLink: String
    let errorWrongCredentials: String
}

struct RegisterCopy {
    let title: String
    let loginLabel: String
    let passwordLabel: String
    let confirmLabel: String
    let submit: String
    let haveAccount: String
    let loginLink: String
    let errorPasswordMismatch: String
    let errorRegistrationFailed: String
}

struct AuthCopy {
    let errorBothRequired: String
    let errorLoginRequired: String
    let errorLoginMinLength: String
    let errorPasswordRequired: String
    let errorPasswordMinLength: String
    let errorNetwork: String
}

struct HeaderCopy {
    let searchPlaceholder: String
    let menuLabel: String
    let switchToDark: String
    let switchToLight: String
    let switchLang: String
}

struct CopyBook {
    let nav: NavCopy
    let home: HomeCopy
    let login: LoginCopy
    let register: RegisterCopy
    let auth: AuthCopy
    let header: HeaderCopy
}

extension CopyBook {
    static func of(_ lang: Lang) -> CopyBook {
        lang == .en ? en : ru
    }

    static let en = CopyBook(
        nav: NavCopy(home: "Home", login: "Login", register: "Register", stack: "Stack"),
        home: HomeCopy(
            title: "Multistack",
            blurb: "Swift SwiftUI native app — session from {api}.",
            session: "Session",
            welcome: "Welcome, {username}!",
            logout: "Logout",
            deleteAccount: "Delete account",
            deleteConfirm: "Delete this account? This cannot be undone.",
            deleteConfirmOk: "Delete",
            deleteConfirmCancel: "Cancel",
            health: "Health",
            healthChecking: "→ Checking health…",
            healthOk: "→ {status} | service: {service} | frontend: {frontend}",
            healthError: "✗ health: {message}"
        ),
        login: LoginCopy(
            title: "Login Form",
            loginLabel: "Login",
            passwordLabel: "Password",
            submit: "Login",
            noAccount: "No account?",
            registerLink: "Register",
            errorWrongCredentials: "Wrong login or password"
        ),
        register: RegisterCopy(
            title: "Register",
            loginLabel: "Login",
            passwordLabel: "Password",
            confirmLabel: "Confirm",
            submit: "Register",
            haveAccount: "Already have an account?",
            loginLink: "Login",
            errorPasswordMismatch: "Passwords do not match",
            errorRegistrationFailed: "Registration failed"
        ),
        auth: AuthCopy(
            errorBothRequired:
                "Login and password are required (minimum {minLogin} and {minPassword} characters)",
            errorLoginRequired: "Login is required (minimum {minLogin} characters)",
            errorLoginMinLength: "Login must be at least {minLogin} characters",
            errorPasswordRequired: "Password is required (minimum {minPassword} characters)",
            errorPasswordMinLength: "Password must be at least {minPassword} characters",
            errorNetwork: "Network error. Check your connection and try again."
        ),
        header: HeaderCopy(
            searchPlaceholder: "Поиск",
            menuLabel: "Меню",
            switchToDark: "Switch to dark theme",
            switchToLight: "Switch to light theme",
            switchLang: "Switch to Russian"
        )
    )

    static let ru = CopyBook(
        nav: NavCopy(home: "Главная", login: "Вход", register: "Регистрация", stack: "Стек"),
        home: HomeCopy(
            title: "Multistack",
            blurb: "Нативное приложение Swift SwiftUI — сессия из {api}.",
            session: "Сессия",
            welcome: "Добро пожаловать, {username}!",
            logout: "Выйти",
            deleteAccount: "Удалить аккаунт",
            deleteConfirm: "Удалить этот аккаунт? Это нельзя отменить.",
            deleteConfirmOk: "Удалить",
            deleteConfirmCancel: "Отмена",
            health: "Статус",
            healthChecking: "→ Проверка статуса…",
            healthOk: "→ {status} | сервис: {service} | фронтенд: {frontend}",
            healthError: "✗ статус: {message}"
        ),
        login: LoginCopy(
            title: "Форма входа",
            loginLabel: "Логин",
            passwordLabel: "Пароль",
            submit: "Войти",
            noAccount: "Нет аккаунта?",
            registerLink: "Регистрация",
            errorWrongCredentials: "Неверный логин или пароль"
        ),
        register: RegisterCopy(
            title: "Регистрация",
            loginLabel: "Логин",
            passwordLabel: "Пароль",
            confirmLabel: "Подтверждение",
            submit: "Зарегистрироваться",
            haveAccount: "Уже есть аккаунт?",
            loginLink: "Войти",
            errorPasswordMismatch: "Пароли не совпадают",
            errorRegistrationFailed: "Регистрация не удалась"
        ),
        auth: AuthCopy(
            errorBothRequired: "Нужны логин и пароль (минимум {minLogin} и {minPassword} символов)",
            errorLoginRequired: "Логин обязателен (минимум {minLogin} символов)",
            errorLoginMinLength: "Логин должен быть не короче {minLogin} символов",
            errorPasswordRequired: "Пароль обязателен (минимум {minPassword} символов)",
            errorPasswordMinLength: "Пароль должен быть не короче {minPassword} символов",
            errorNetwork: "Ошибка сети. Проверьте соединение и попробуйте снова."
        ),
        header: HeaderCopy(
            searchPlaceholder: "Поиск",
            menuLabel: "Меню",
            switchToDark: "Switch to dark theme",
            switchToLight: "Switch to light theme",
            // `setLangState` in js/header.js keeps this string Russian-side.
            switchLang: "Переключить на English"
        )
    )
}

/// `lib/auth.ts` `formatMessage` — `{key}` placeholders, missing key → "".
func formatMessage(_ template: String, _ values: [String: String]) -> String {
    var result = ""
    var rest = Substring(template)
    while let open = rest.firstIndex(of: "{") {
        guard let close = rest[open...].firstIndex(of: "}") else { break }
        let key = String(rest[rest.index(after: open)..<close])
        result += rest[rest.startIndex..<open]
        result += values[key] ?? ""
        rest = rest[rest.index(after: close)...]
    }
    return result + rest
}
