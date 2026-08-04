package tests.integration;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.StackPage;

@Layer("integration")
@Epic("Stack")
@Feature("Stack page")
@DisplayName("Stack page mount")
class StackPageTests extends TestBase {

    private final StackPage stackPage = new StackPage();

    @Test
    @Tag("mount")
    @DisplayName("Stack page and header are visible")
    void stackPageIsMounted() {
        stackPage.openPage()
                .shouldShowEmbeddedHeader()
                .shouldShowStackPage();
    }
}
