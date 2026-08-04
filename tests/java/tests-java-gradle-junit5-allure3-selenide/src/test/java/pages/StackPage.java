package pages;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

import java.time.Duration;

public class StackPage {

    private final SelenideElement root = $("[data-testid='stack-page']");
    private final SelenideElement currentPair = $("[data-testid='stack-current-pair']");
    private final SelenideElement testsBoard = $("[data-testid='stack-tests-board']");
    private final SelenideElement header = $("[data-testid='header']");

    @Step("Open stack page")
    public StackPage openPage() {
        open("/stack/");
        return this;
    }

    @Step("Verify stack page is mounted")
    public StackPage shouldShowStackPage() {
        root.shouldBe(visible, Duration.ofSeconds(10));
        currentPair.shouldBe(visible, Duration.ofSeconds(10));
        return this;
    }

    @Step("Verify matrix boards are loaded")
    public StackPage shouldShowMatrixBoards() {
        testsBoard.shouldBe(visible, Duration.ofSeconds(15));
        return this;
    }

    @Step("Verify embedded header is mounted")
    public StackPage shouldShowEmbeddedHeader() {
        header.shouldBe(visible, Duration.ofSeconds(10));
        return this;
    }
}
