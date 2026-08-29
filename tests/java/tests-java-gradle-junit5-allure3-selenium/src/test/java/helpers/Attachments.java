package helpers;

import io.qameta.allure.Allure;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.logging.LogType;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public final class Attachments {

    private Attachments() {
    }

    public static void screenshot(String name) {
        if (!(WebDriverHolder.get() instanceof TakesScreenshot camera)) {
            return;
        }
        Allure.addAttachment(name, "image/png", new ByteArrayInputStream(
                camera.getScreenshotAs(OutputType.BYTES)), "png");
    }

    public static void pageSource() {
        Allure.addAttachment(
                "Page source",
                "text/html",
                WebDriverHolder.get().getPageSource(),
                ".html");
    }

    public static void browserConsoleLogs() {
        WebDriver driver = WebDriverHolder.get();
        try {
            var logs = driver.manage().logs().get(LogType.BROWSER);
            var text = new StringBuilder();
            logs.forEach(entry -> text.append(entry.getLevel()).append(' ').append(entry.getMessage()).append('\n'));
            Allure.addAttachment("Browser console", "text/plain", text.toString(), ".txt");
        } catch (RuntimeException ignored) {
            // Some drivers do not expose browser logs.
        }
    }

    public static void asUtf8(String name, String body) {
        Allure.addAttachment(name, "text/plain", new ByteArrayInputStream(
                body.getBytes(StandardCharsets.UTF_8)), ".txt");
    }
}
