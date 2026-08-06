package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.StackPage;

@Layer("e2e")
@Epic("Stack")
@Feature("Stack switcher")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Stack")
class StackTests extends TestBase {

    private final StackPage stackPage = new StackPage();

    @Test
    @Tag("smoke")
    @DisplayName("Stack page loads matrix boards")
    void stackPageLoadsMatrix() {
        stackPage.openPage()
                .shouldShowStackPage()
                .shouldShowMatrixBoards();
    }
}
