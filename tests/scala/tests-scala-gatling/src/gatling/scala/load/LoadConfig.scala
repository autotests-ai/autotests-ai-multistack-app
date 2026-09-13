package load

/**
 * Stand + injection knobs for the Gatling JVM (not Gradle).
 * Seed user matches testdata-user: `user1` / `password1`.
 */
object LoadConfig {

  def apiBaseUrl: String =
    stripTrailingSlash(
      firstNonBlank(System.getProperty("apiBaseUrl"), sys.env.getOrElse("API_BASE_URL", ""), "http://localhost:8800")
    )

  def username: String =
    firstNonBlank(System.getProperty("username"), sys.env.getOrElse("LOAD_USERNAME", ""), "user1")

  def password: String =
    firstNonBlank(System.getProperty("password"), sys.env.getOrElse("LOAD_PASSWORD", ""), "password1")

  def profile: String =
    firstNonBlank(System.getProperty("gatling.profile"), sys.env.getOrElse("GATLING_PROFILE", ""), "smoke").toLowerCase

  def users: Int =
    math.max(1, parseInt(firstNonBlank(System.getProperty("gatling.users"), sys.env.getOrElse("GATLING_USERS", ""), "1"), 1))

  def duringSeconds: Int =
    math.max(
      1,
      parseInt(
        firstNonBlank(
          System.getProperty("gatling.duringSeconds"),
          sys.env.getOrElse("GATLING_DURING_SECONDS", ""),
          "30"
        ),
        30
      )
    )

  def p95Ms: Int =
    math.max(
      1,
      parseInt(firstNonBlank(System.getProperty("gatling.p95Ms"), sys.env.getOrElse("GATLING_P95_MS", ""), "2000"), 2000)
    )

  def allowPublic: Boolean =
    firstNonBlank(
      System.getProperty("gatling.allowPublic"),
      sys.env.getOrElse("GATLING_ALLOW_PUBLIC", ""),
      "false"
    ).toBoolean

  def loginJson: String =
    s"""{"username":"${jsonEscape(username)}","password":"${jsonEscape(password)}"}"""

  def refuseSharedProd(baseUrl: String): Unit = {
    val lower = baseUrl.toLowerCase
    val shared = lower.contains("autotests.ai") || lower.contains("qa.guru")
    if (shared && !allowPublic) {
      throw new IllegalStateException(
        s"Refusing $baseUrl — isolated SUT only. Pass -Dgatling.allowPublic=true when the host is a dedicated load stand."
      )
    }
  }

  private def firstNonBlank(values: String*): String =
    values.find(v => v != null && v.trim.nonEmpty).map(_.trim).getOrElse("")

  private def stripTrailingSlash(url: String): String =
    if (url.endsWith("/")) url.dropRight(1) else url

  private def parseInt(raw: String, fallback: Int): Int =
    try Integer.parseInt(raw)
    catch { case _: NumberFormatException => fallback }

  private def jsonEscape(value: String): String =
    value.replace("\\", "\\\\").replace("\"", "\\\"")
}
