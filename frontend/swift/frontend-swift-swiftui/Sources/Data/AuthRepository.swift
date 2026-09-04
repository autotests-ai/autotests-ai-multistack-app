import Foundation

/// `_contract/flows/login.md` — the auth surface this cell talks to.
struct AuthResponse {
    let token: String
    let username: String
    let redirectUrl: String?
}

struct UserProfile {
    let username: String
}

struct Health {
    let status: String
    let service: String
}

/// `lib/auth.ts` MIN_LOGIN_LENGTH / MIN_PASSWORD_LENGTH.
let minLoginLength = 3
let minPasswordLength = 6

struct AuthRepository {
    let session: Session

    func login(username: String, password: String) async throws -> AuthResponse {
        let payload = try await ApiClient.request(
            method: "POST",
            path: "/auth/login",
            body: ["username": username, "password": password]
        )
        return authResponse(payload)
    }

    func register(username: String, password: String) async throws -> AuthResponse {
        let payload = try await ApiClient.request(
            method: "POST",
            path: "/auth/register",
            body: ["username": username, "password": password]
        )
        return authResponse(payload)
    }

    func profile() async throws -> UserProfile {
        guard let token = session.token else {
            throw ApiError(message: "Missing auth token")
        }
        let payload = try await ApiClient.request(method: "GET", path: "/auth/me", token: token)
        return UserProfile(username: payload["username"] as? String ?? "")
    }

    func health() async throws -> Health {
        let payload = try await ApiClient.request(method: "GET", path: "/health")
        return Health(
            status: payload["status"] as? String ?? "",
            service: payload["service"] as? String ?? ""
        )
    }

    /// Logout and account deletion both drop the local session even when the
    /// call fails — a dead token must never keep the UI signed in (`lib/auth.ts`).
    func logout() async {
        if let token = session.token {
            _ = try? await ApiClient.request(method: "POST", path: "/auth/logout", token: token)
        }
        session.clear()
    }

    func deleteAccount() async {
        if let token = session.token {
            _ = try? await ApiClient.request(method: "DELETE", path: "/auth/me", token: token)
        }
        session.clear()
    }

    private func authResponse(_ payload: [String: Any]) -> AuthResponse {
        let redirect = payload["redirectUrl"] as? String
        return AuthResponse(
            token: payload["token"] as? String ?? "",
            username: payload["username"] as? String ?? "",
            redirectUrl: redirect?.isEmpty == false ? redirect : nil
        )
    }
}

/// `lib/auth.ts validateCredentials` — same order, same messages.
func validateCredentials(login: String, password: String, copy: AuthCopy) -> String? {
    let minima = [
        "minLogin": String(minLoginLength),
        "minPassword": String(minPasswordLength),
    ]
    if login.isEmpty && password.isEmpty {
        return formatMessage(copy.errorBothRequired, minima)
    }
    if login.isEmpty {
        return formatMessage(copy.errorLoginRequired, minima)
    }
    if login.count < minLoginLength {
        return formatMessage(copy.errorLoginMinLength, minima)
    }
    if password.isEmpty {
        return formatMessage(copy.errorPasswordRequired, minima)
    }
    if password.count < minPasswordLength {
        return formatMessage(copy.errorPasswordMinLength, minima)
    }
    return nil
}

/// `lib/auth.ts resolveAuthErrorMessage`.
func resolveAuthErrorMessage(_ error: Error, copy: AuthCopy, fallback: String) -> String {
    guard let api = error as? ApiError else {
        return fallback
    }
    if api.network {
        return copy.errorNetwork
    }
    return api.message.isEmpty ? fallback : api.message
}
