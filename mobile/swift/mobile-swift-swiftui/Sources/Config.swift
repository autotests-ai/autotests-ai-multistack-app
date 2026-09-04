import Foundation

/// Product mount id, reported by the Health panel (SPA `UI_MOUNT`).
let uiMount = "mobile-swift-swiftui"

/// Runtime wiring for the matrix backend cell. Precedence: launch environment
/// (Appium `processArguments.env`) → Info.plist (build setting) → live pair.
enum Config {
    static let apiBase = value(
        env: "MULTISTACK_API_BASE",
        plist: "MultistackApiBase",
        fallback: "https://autotests.ai/stack/backend-java-spring/api"
    )

    /// Scopes the stored token exactly like the SPA (`authToken:<backendId>`).
    static let backendId = value(
        env: "MULTISTACK_BACKEND_ID",
        plist: "MultistackBackendId",
        fallback: "backend-java-spring"
    )

    /// `/stack/` board opened by `header-nav-stack` (no WebView — Safari).
    static let stackIndexUrl = value(
        env: "MULTISTACK_STACK_INDEX_URL",
        plist: "MultistackStackIndexUrl",
        fallback: "https://autotests.ai/stack/"
    )

    private static func value(env: String, plist: String, fallback: String) -> String {
        if let fromEnv = ProcessInfo.processInfo.environment[env], !fromEnv.isEmpty {
            return fromEnv
        }
        if let fromPlist = Bundle.main.object(forInfoDictionaryKey: plist) as? String,
           !fromPlist.isEmpty,
           !fromPlist.hasPrefix("$(") {
            return fromPlist
        }
        return fallback
    }
}
