import Foundation
import SwiftUI

/// The SPA routes, minus the note screen: `/`, `/login`, `/register`.
enum Screen {
    case home
    case login
    case register
}

enum HealthState {
    case checking
    case ok(status: String, service: String)
    case failed(message: String)
}

/// Screen state + auth flow for the whole cell — the SwiftUI twin of the
/// Compose cell's `AppState`.
@MainActor
final class AppState: ObservableObject {
    private let session: Session
    private let repository: AuthRepository

    @Published private(set) var screen: Screen

    /// `theme: { default: 'dark' }` in `lib/headerConfig.ts`.
    @Published private(set) var isLight = false

    /// `lang: { default: 'en' }`.
    @Published private(set) var lang: Lang = .en

    @Published private(set) var menuOpen = false

    @Published var search = ""
    @Published var menuSearch = ""

    @Published var loginUsername = ""
    @Published var loginPassword = ""
    @Published private(set) var loginError = ""
    @Published private(set) var loginSubmitting = false

    @Published var registerUsername = ""
    @Published var registerPassword = ""
    @Published var registerConfirmPassword = ""
    @Published private(set) var registerError = ""
    @Published private(set) var registerSubmitting = false

    @Published private(set) var welcomeName: String?
    @Published private(set) var health: HealthState = .checking
    @Published var confirmingDelete = false

    init(session: Session = Session()) {
        self.session = session
        repository = AuthRepository(session: session)
        screen = session.token != nil ? .home : .login
    }

    var copy: CopyBook { CopyBook.of(lang) }

    // MARK: - header

    func toggleMenu() { menuOpen.toggle() }

    func closeMenu() { menuOpen = false }

    func toggleLang() { lang = lang.other }

    func toggleTheme() { isLight.toggle() }

    // MARK: - navigation

    func navigate(to target: Screen) {
        closeMenu()
        // `LoginPage`/`RegisterPage` bounce to `/` while a token is stored.
        screen = (target != .home && session.token != nil) ? .home : target
        if screen == .home {
            loadHome()
        }
    }

    /// Escape key / swipe-back equivalent. True when consumed.
    @discardableResult
    func back() -> Bool {
        if menuOpen {
            closeMenu()
            return true
        }
        if confirmingDelete {
            confirmingDelete = false
            return true
        }
        if screen == .register {
            navigate(to: .login)
            return true
        }
        return false
    }

    // MARK: - auth

    func submitLogin() {
        let messages = copy.auth
        let username = loginUsername.trimmingCharacters(in: .whitespacesAndNewlines)
        let password = loginPassword.trimmingCharacters(in: .whitespacesAndNewlines)
        if let validation = validateCredentials(login: username, password: password, copy: messages) {
            loginError = validation
            return
        }
        loginError = ""
        loginSubmitting = true
        Task {
            do {
                let response = try await repository.login(username: username, password: password)
                session.save(response.token)
                loginPassword = ""
                navigate(to: .home)
            } catch {
                loginError = resolveAuthErrorMessage(
                    error,
                    copy: messages,
                    fallback: copy.login.errorWrongCredentials
                )
            }
            loginSubmitting = false
        }
    }

    func submitRegister() {
        let book = copy
        let username = registerUsername.trimmingCharacters(in: .whitespacesAndNewlines)
        let password = registerPassword.trimmingCharacters(in: .whitespacesAndNewlines)
        let confirm = registerConfirmPassword.trimmingCharacters(in: .whitespacesAndNewlines)
        if let validation = validateCredentials(login: username, password: password, copy: book.auth) {
            registerError = validation
            return
        }
        if password != confirm {
            registerError = book.register.errorPasswordMismatch
            return
        }
        registerError = ""
        registerSubmitting = true
        Task {
            do {
                let response = try await repository.register(username: username, password: password)
                session.save(response.token)
                registerPassword = ""
                registerConfirmPassword = ""
                navigate(to: .home)
            } catch {
                registerError = resolveAuthErrorMessage(
                    error,
                    copy: book.auth,
                    fallback: book.register.errorRegistrationFailed
                )
            }
            registerSubmitting = false
        }
    }

    func logout() {
        Task {
            await repository.logout()
            welcomeName = nil
            navigate(to: .login)
        }
    }

    func requestDeleteAccount() { confirmingDelete = true }

    func cancelDelete() { confirmingDelete = false }

    func confirmDeleteAccount() {
        confirmingDelete = false
        Task {
            await repository.deleteAccount()
            welcomeName = nil
            navigate(to: .login)
        }
    }

    /// `HomePage` mount effect: health probe + profile, session dropped on 401.
    func loadHome() {
        health = .checking
        Task {
            do {
                let payload = try await repository.health()
                health = .ok(status: payload.status, service: payload.service)
            } catch {
                let message = (error as? ApiError)?.message ?? ""
                health = .failed(message: message)
            }
        }
        guard session.token != nil else {
            welcomeName = nil
            return
        }
        Task {
            do {
                welcomeName = try await repository.profile().username
            } catch {
                session.clear()
                welcomeName = nil
            }
        }
    }

    var healthText: String {
        switch health {
        case .checking:
            return copy.home.healthChecking
        case let .ok(status, service):
            return formatMessage(
                copy.home.healthOk,
                ["status": status, "service": service, "frontend": uiMount]
            )
        case let .failed(message):
            return formatMessage(copy.home.healthError, ["message": message])
        }
    }

    var healthFailed: Bool {
        if case .failed = health { return true }
        return false
    }
}
