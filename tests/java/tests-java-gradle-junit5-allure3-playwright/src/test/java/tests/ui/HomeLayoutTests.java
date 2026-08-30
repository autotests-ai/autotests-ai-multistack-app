package tests.ui;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("ui")
@Epic("Home")
@Feature("Layout")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Home layout")
class HomeLayoutTests extends TestBase {

    @Test
    @Tag("ui")
    @Tag("mock")
    @DisplayName("Home shows embedded header and reference layout")
    void homeShowsEmbeddedHeaderAndLayout() {
        app.home.open();
        assertThat(app.home.header).isVisible();
        app.home.shouldShowLayout();
    }
}
