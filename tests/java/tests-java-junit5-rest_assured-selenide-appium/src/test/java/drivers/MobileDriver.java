package drivers;

import com.codeborne.selenide.WebDriverProvider;
import config.AppPlatform;
import config.MobileCapabilities;
import config.MobileConfig;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.WebDriver;

import java.net.MalformedURLException;
import java.net.URL;

public class MobileDriver implements WebDriverProvider {

    @Override
    public WebDriver createDriver(Capabilities capabilities) {
        try {
            URL hub = new URL(MobileConfig.hubUrl());
            String session = "multistack-login";
            if (AppPlatform.current() == AppPlatform.IOS) {
                return new IOSDriver(hub, MobileCapabilities.multistack(session));
            }
            return new AndroidDriver(hub, MobileCapabilities.multistack(session));
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Invalid Appium hub URL", e);
        }
    }
}
