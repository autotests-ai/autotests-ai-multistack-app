import Foundation

/// `lib/auth.ts` `apiRequest` in Swift: same paths, same JSON bodies, same
/// error shape. A transport failure is `network == true` (the SPA's
/// `createNetworkError`); a non-2xx answer surfaces the server `message`.
struct ApiError: Error {
    let message: String
    var network: Bool = false
}

enum ApiClient {
    /// `Config.apiBase` already ends at `…/api`.
    private static var base: String {
        var value = Config.apiBase
        while value.hasSuffix("/") {
            value.removeLast()
        }
        return value
    }

    static func request(
        method: String,
        path: String,
        body: [String: String]? = nil,
        token: String? = nil
    ) async throws -> [String: Any] {
        guard let url = URL(string: base + path) else {
            throw ApiError(message: "Bad API url: \(base)\(path)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw ApiError(message: "", network: true)
        }

        let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200...299).contains(status) else {
            let message = payload["message"] as? String
            throw ApiError(message: message?.isEmpty == false ? message! : "Request failed")
        }
        return payload
    }
}
