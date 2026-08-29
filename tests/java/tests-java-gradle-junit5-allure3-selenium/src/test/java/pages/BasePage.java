package pages;

import helpers.Ui;
import io.qameta.allure.Step;
import pages.components.HeaderComponent;

public abstract class BasePage<T extends BasePage<T>> {

    public final HeaderComponent header = new HeaderComponent();

    public abstract T shouldBeOpen();

    @Step("Reload current page")
    public T reloadPage() {
        Ui.refresh();
        return shouldBeOpen();
    }
}
