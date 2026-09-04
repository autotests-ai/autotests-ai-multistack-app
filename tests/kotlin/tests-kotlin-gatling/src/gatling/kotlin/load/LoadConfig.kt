package load

/**
 * Stand + injection knobs for the Gatling JVM (not Gradle).
 * Seed user matches testdata-user: `user1` / `password1`.
 */
object LoadConfig {

    fun apiBaseUrl(): String = stripTrailingSlash(
        firstNonBlank(System.getProperty("apiBaseUrl"), System.getenv("API_BASE_URL"), "http://localhost:8800")
    )

    fun username(): String =
        firstNonBlank(System.getProperty("username"), System.getenv("LOAD_USERNAME"), "user1")

    fun password(): String =
        firstNonBlank(System.getProperty("password"), System.getenv("LOAD_PASSWORD"), "password1")

    fun profile(): String =
        firstNonBlank(System.getProperty("gatling.profile"), System.getenv("GATLING_PROFILE"), "smoke")
            .lowercase()

    fun users(): Int = maxOf(
        1,
        parseInt(firstNonBlank(System.getProperty("gatling.users"), System.getenv("GATLING_USERS"), "1"), 1)
    )

    fun duringSeconds(): Int = maxOf(
        1,
        parseInt(
            firstNonBlank(
                System.getProperty("gatling.duringSeconds"),
                System.getenv("GATLING_DURING_SECONDS"),
                "30"
            ),
            30
        )
    )

    fun p95Ms(): Int = maxOf(
        1,
        parseInt(firstNonBlank(System.getProperty("gatling.p95Ms"), System.getenv("GATLING_P95_MS"), "2000"), 2000)
    )

    fun allowPublic(): Boolean = firstNonBlank(
        System.getProperty("gatling.allowPublic"),
        System.getenv("GATLING_ALLOW_PUBLIC"),
        "false"
    ).toBoolean()

    fun loginJson(): String =
        """{"username":"${jsonEscape(username())}","password":"${jsonEscape(password())}"}"""

    fun refuseSharedProd(baseUrl: String) {
        val lower = baseUrl.lowercase()
        val shared = lower.contains("autotests.ai") || lower.contains("qa.guru")
        if (shared && !allowPublic()) {
            throw IllegalStateException(
                "Refusing $baseUrl — isolated SUT only. Pass -Dgatling.allowPublic=true when the host is a dedicated load stand."
            )
        }
    }

    private fun firstNonBlank(vararg values: String?): String {
        for (value in values) {
            if (!value.isNullOrBlank()) {
                return value.trim()
            }
        }
        return ""
    }

    private fun stripTrailingSlash(url: String): String =
        if (url.endsWith("/")) url.dropLast(1) else url

    private fun parseInt(raw: String, fallback: Int): Int = raw.toIntOrNull() ?: fallback

    private fun jsonEscape(value: String): String =
        value.replace("\\", "\\\\").replace("\"", "\\\"")
}
