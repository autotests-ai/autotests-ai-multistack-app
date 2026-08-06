package tests.integration;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("integration")
@Epic("Home")
@Feature("Home layout")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Home layout mount")
class HomeLayoutTests extends TestBase {

    @Test
    @Tag("mount")
    @DisplayName("Home shows embedded header and reference layout")
    void homeLayoutIsMounted() {
        homePage.openPage()
                .shouldShowEmbeddedHeader()
                .shouldShowLayout();
    }
}
