package helpers;

import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;

/** Contract testid → Appium accessibility id (Android content-desc / iOS identifier). */
public final class TestIds {

    private TestIds() {
    }

    public static By id(String testId) {
        return AppiumBy.accessibilityId(testId);
    }
}
