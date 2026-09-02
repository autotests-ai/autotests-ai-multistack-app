using Config;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace Helpers;

/// <summary>Thin Selenium wait/locator helpers so page objects stay fluent without Selenide.</summary>
public static class Ui
{
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(5);

    public static IWebDriver Driver() => WebDriverHolder.Get();

    public static void Open(string path)
    {
        var baseUrl = ConfigReader.ResolveBaseUrl();
        if (string.IsNullOrWhiteSpace(path) || path == "/")
        {
            Driver().Navigate().GoToUrl(baseUrl);
            return;
        }

        var relative = path.StartsWith('/') ? path[1..] : path;
        Driver().Navigate().GoToUrl(new Uri(new Uri(baseUrl), relative).ToString());
    }

    public static void Refresh() => Driver().Navigate().Refresh();

    public static By TestId(string id) => By.CssSelector($"[data-testid='{id}']");

    public static IWebElement El(By locator) =>
        WaitUntil(d =>
        {
            var found = d.FindElements(locator);
            return found.Count > 0 && found[0].Displayed ? found[0] : null;
        })!;

    public static IWebElement El(string testId) => El(TestId(testId));

    public static IReadOnlyList<IWebElement> All(By locator) => Driver().FindElements(locator);

    public static void Click(By locator)
    {
        WaitUntil(d =>
        {
            var found = d.FindElements(locator);
            return found.Count > 0 && found[0].Displayed && found[0].Enabled ? found[0] : null;
        })!.Click();
    }

    public static void Click(string testId) => Click(TestId(testId));

    public static void Confirm(string expectedText)
    {
        var alert = WaitUntil(_ =>
        {
            try
            {
                return Driver().SwitchTo().Alert();
            }
            catch (NoAlertPresentException)
            {
                return null;
            }
        })!;
        var actual = alert.Text;
        if (actual != expectedText)
        {
            throw new AssertionException($"Confirm text: expected <{expectedText}> but was <{actual}>");
        }

        alert.Accept();
    }

    public static void Dismiss(string expectedText)
    {
        var alert = WaitUntil(_ =>
        {
            try
            {
                return Driver().SwitchTo().Alert();
            }
            catch (NoAlertPresentException)
            {
                return null;
            }
        })!;
        var actual = alert.Text;
        if (actual != expectedText)
        {
            throw new AssertionException($"Confirm text: expected <{expectedText}> but was <{actual}>");
        }

        alert.Dismiss();
    }

    public static void SetValue(By locator, string? value)
    {
        var element = El(locator);
        var text = value ?? "";
        ((IJavaScriptExecutor)Driver()).ExecuteScript(
            """
            const el = arguments[0];
            const value = arguments[1];
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            ).set;
            setter.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            text);
    }

    public static void SetValue(string testId, string? value) => SetValue(TestId(testId), value);

    public static void ShouldBeVisible(By locator) => El(locator);

    public static void ShouldBeVisible(string testId) => ShouldBeVisible(TestId(testId));

    public static void ShouldBeHidden(By locator) =>
        WaitUntil(d =>
        {
            var found = d.FindElements(locator);
            return found.Count == 0 || !found[0].Displayed ? true : (bool?)null;
        });

    public static void ShouldHaveText(By locator, string text) =>
        WaitUntil(d =>
        {
            var elements = d.FindElements(locator);
            if (elements.Count == 0 || !elements[0].Displayed)
            {
                return (bool?)null;
            }

            return elements[0].Text.Contains(text) ? true : null;
        });

    public static void ShouldHaveText(string testId, string text) => ShouldHaveText(TestId(testId), text);

    public static void ShouldHaveAttribute(By locator, string name, string value) =>
        WaitUntil(d =>
        {
            var found = d.FindElements(locator);
            if (found.Count == 0)
            {
                return (bool?)null;
            }

            var actual = found[0].GetAttribute(name);
            if (string.IsNullOrEmpty(value))
            {
                return actual != null ? true : null;
            }

            return value == actual ? true : null;
        });

    public static void ShouldHaveAttribute(string testId, string name, string value) =>
        ShouldHaveAttribute(TestId(testId), name, value);

    public static void ShouldHaveCssClass(By locator, string cssClass) =>
        WaitUntil(d => HasClass(d.FindElements(locator), cssClass) ? true : (bool?)null);

    public static void ShouldNotHaveCssClass(By locator, string cssClass) =>
        WaitUntil(d => !HasClass(d.FindElements(locator), cssClass) ? true : (bool?)null);

    public static object? Js(string script, params object?[] args) =>
        ((IJavaScriptExecutor)Driver()).ExecuteScript(script, args);

    public static T WaitUntil<T>(Func<IWebDriver, T?> condition, TimeSpan? timeout = null)
    {
        var wait = new WebDriverWait(Driver(), timeout ?? Timeout)
        {
            PollingInterval = TimeSpan.FromMilliseconds(100),
        };
        wait.IgnoreExceptionTypes(typeof(StaleElementReferenceException), typeof(NoSuchElementException));
        return wait.Until(condition)!;
    }

    private static bool HasClass(IReadOnlyCollection<IWebElement> found, string cssClass)
    {
        if (found.Count == 0)
        {
            return false;
        }

        var classes = found.ElementAt(0).GetAttribute("class");
        if (classes == null)
        {
            return false;
        }

        return classes.Split(' ', StringSplitOptions.RemoveEmptyEntries).Contains(cssClass);
    }
}
