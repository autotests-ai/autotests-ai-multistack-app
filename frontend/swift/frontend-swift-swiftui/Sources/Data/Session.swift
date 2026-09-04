import Foundation

/// The SPA keeps the token in `localStorage` under `authToken:<backendId>`
/// (`lib/appBase.ts authTokenStorageKey`). `UserDefaults` is the native
/// equivalent and reuses the same key, so a session is scoped per matrix
/// backend and never leaks across cells.
struct Session {
    let tokenKey: String

    init(backendId: String = Config.backendId) {
        tokenKey = backendId.isEmpty ? "authToken" : "authToken:\(backendId)"
    }

    var token: String? {
        guard let value = UserDefaults.standard.string(forKey: tokenKey), !value.isEmpty else {
            return nil
        }
        return value
    }

    func save(_ token: String) {
        UserDefaults.standard.set(token, forKey: tokenKey)
    }

    func clear() {
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }
}
