package allure;

import config.TestConfig;
import io.qameta.allure.Allure;
import io.qameta.allure.AttachmentOptions;
import io.restassured.path.json.JsonPath;
import io.restassured.response.Response;

import java.io.ByteArrayInputStream;
import java.net.URI;

import static io.restassured.RestAssured.given;

/**
 * Artifacts fetched over HTTP after the session ends, keyed by session id —
 * the live driver is already gone at this point.
 * Selenoid: &lt;hub&gt;/video/&lt;id&gt;.mp4 (creds come from the hub URL).
 * BrowserStack: api-cloud.browserstack.com/app-automate/sessions/&lt;id&gt;.json
 * (basic auth = browserstack.user/key).
 */
final class SessionArtifacts {

    private static final String BSTACK_SESSION_API =
            "https://api-cloud.browserstack.com/app-automate/sessions/%s.json";

    private SessionArtifacts() {
    }

    /**
     * Selenoid video — the hub serves mp4 at /video/&lt;sessionId&gt;.mp4 once it
     * finishes flushing the recording, so it is polled briefly. The link is
     * added only when the file actually exists, together with the mp4 itself.
     */
    static void selenoidVideo(String sessionId, String hubSpec) {
        URI hub = URI.create(hubSpec);
        String base = hub.getScheme() + "://" + hub.getHost()
                + (hub.getPort() == -1 ? "" : ":" + hub.getPort());
        String videoUrl = base + "/video/" + sessionId + ".mp4";

        String userInfo = hub.getUserInfo();
        String user = userInfo == null ? null : userInfo.split(":", 2)[0];
        String pass = userInfo == null ? null : userInfo.split(":", 2)[1];

        Response response = null;
        for (int i = 0; i < 10; i++) {
            response = user == null
                    ? given().get(videoUrl)
                    : given().auth().preemptive().basic(user, pass).get(videoUrl);
            if (response.statusCode() == 200) {
                break;
            }
            sleep(3_000);
        }
        if (response != null && response.statusCode() == 200) {
            Allure.link("Selenoid video", videoUrl);
            Allure.attachment("Video", "video/mp4",
                    new ByteArrayInputStream(response.asByteArray()),
                    AttachmentOptions.withFileExtension(".mp4"));
        }
    }

    /**
     * BrowserStack App Automate artifacts. video_url only appears after
     * BrowserStack finishes processing, so the session doc is polled briefly.
     */
    static void browserstackArtifacts(String sessionId, TestConfig config) {
        String user = config.browserstackUser();
        String key = config.browserstackKey();
        if (blank(user) || blank(key)) {
            return;
        }

        JsonPath session = null;
        for (int i = 0; i < 10; i++) {
            Response response = given()
                    .auth().preemptive().basic(user, key)
                    .get(String.format(BSTACK_SESSION_API, sessionId));
            if (response.statusCode() == 200) {
                session = response.jsonPath();
                if (!config.attachVideo()
                        || session.getString("automation_session.video_url") != null) {
                    break;
                }
            }
            sleep(3_000);
        }
        if (session == null) {
            return;
        }

        String publicUrl = session.getString("automation_session.public_url");
        if (publicUrl != null) {
            Allure.link("BrowserStack session", publicUrl);
        }

        if (config.attachVideo()) {
            attachUrl(session, "automation_session.video_url",
                    "Video", "video/mp4", ".mp4", user, key);
        }
        if (config.attachDriverLogs()) {
            attachUrl(session, "automation_session.device_logs_url",
                    "Device logs", "text/plain", ".log", user, key);
            attachUrl(session, "automation_session.appium_logs_url",
                    "Appium logs", "text/plain", ".log", user, key);
            attachUrl(session, "automation_session.network_logs_url",
                    "Network logs", "application/json", ".har", user, key);
        }
    }

    private static void attachUrl(JsonPath session, String path, String name,
                                  String mimeType, String extension, String user, String key) {
        String url = session.getString(path);
        if (url == null) {
            return;
        }
        Response response = given().get(url);
        if (response.statusCode() == 401 || response.statusCode() == 403) {
            response = given().auth().preemptive().basic(user, key).get(url);
        }
        if (response.statusCode() == 200) {
            Allure.attachment(name, mimeType,
                    new ByteArrayInputStream(response.asByteArray()),
                    AttachmentOptions.withFileExtension(extension));
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank() || value.startsWith("${");
    }
}
