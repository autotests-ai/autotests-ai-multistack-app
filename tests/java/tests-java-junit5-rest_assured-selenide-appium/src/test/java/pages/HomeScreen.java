package pages;

import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class HomeScreen {

    @Step("Welcome message is {expected}")
    public HomeScreen shouldHaveWelcomeMessage(String expected) {
        $(id("welcome-panel")).shouldBe(visible);
        $(id("welcome-message")).shouldHave(text(expected));
        return this;
    }
}
