package dev.multistack.compose.data

import dev.multistack.compose.BuildConfig
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * `lib/auth.ts` `apiRequest` in Kotlin: same paths, same JSON bodies, same
 * error shape. A transport failure is `network = true` (the SPA's
 * `createNetworkError`); a non-2xx answer surfaces the server `message`.
 */
class ApiError(
    override val message: String,
    val network: Boolean = false,
) : Exception(message)

object ApiClient {
    /** `API_BASE` already ends at `…/api` — see `gradle.properties apiBase`. */
    private val base: String = BuildConfig.API_BASE.trimEnd('/')

    private const val TIMEOUT_MS = 15_000

    suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        token: String? = null,
    ): JSONObject = withContext(Dispatchers.IO) {
        val connection = try {
            (URL(base + path).openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                token?.let { setRequestProperty("Authorization", "Bearer $it") }
                if (body != null) {
                    doOutput = true
                    outputStream.use { it.write(body.toString().toByteArray()) }
                }
            }
        } catch (_: IOException) {
            throw ApiError("", network = true)
        }

        try {
            val status = connection.responseCode
            val raw = (
                if (status in 200..299) connection.inputStream else connection.errorStream
                )?.bufferedReader()?.use { it.readText() }.orEmpty()
            val payload = runCatching { JSONObject(raw) }.getOrElse { JSONObject() }
            if (status !in 200..299) {
                val message = payload.optString("message").ifBlank { "Request failed" }
                throw ApiError(message)
            }
            payload
        } catch (_: IOException) {
            throw ApiError("", network = true)
        } finally {
            connection.disconnect()
        }
    }
}
