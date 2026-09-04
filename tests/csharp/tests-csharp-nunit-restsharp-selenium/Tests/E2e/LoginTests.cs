using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
using Helpers;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Login")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Login")]
public sealed class LoginTests : TestBase
{
    private const string LoginRequiredMessage = "Login is required (minimum 3 characters)";
    private const string LoginMinLengthMessage = "Login must be at least 3 characters";
    private const string PasswordRequiredMessage = "Password is required (minimum 6 characters)";
    private const string PasswordMinLengthMessage = "Password must be at least 6 characters";
    private const string BothRequiredMessage = "Login and password are required (minimum 3 and 6 characters)";
    private const string WrongCredentialsMessage = "Wrong login or password";

    private User? _minLengthUser;

    [TearDown]
    public void CleanupMinLengthUser()
    {
        if (_minLengthUser != null)
        {
            AuthApiClient.DeleteAccountQuietly(_minLengthUser.Username, _minLengthUser.Password);
            _minLengthUser = null;
        }
    }

    [Test]
    [Category("e2e")]
    [Category("smoke")]
    [Category("positive")]
    [AllureName("User is logged in with valid credentials")]
    public void ShouldLoginWithValidCredentials()
    {
        LoginPage.OpenPage()
            .FillAndSubmitForm("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!");
    }

    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("User is logged in with 3-character login and 6-character password")]
    public void ShouldLoginWithMinimumLengthCredentials()
    {
        _minLengthUser = new User(DataFaker.UsernameAtMinLength(), DataFaker.PasswordAtMinLength());
        AuthApiClient.Register(_minLengthUser.Username, _minLengthUser.Password);
        LoginPage.OpenPage()
            .FillAndSubmitForm(_minLengthUser.Username, _minLengthUser.Password)
            .ShouldHaveWelcomeMessage(_minLengthUser.WelcomeMessage());
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsEmpty()
    {
        LoginPage.OpenPage()
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginRequiredMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty password shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsEmpty()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordRequiredMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Wrong password shows readable error")]
    public void ShouldShowErrorWhenPasswordIsWrong()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword("wrongpassword")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(WrongCredentialsMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Short username shows validation error")]
    public void ShouldShowValidationErrorWhenUsernameIsTooShort()
    {
        LoginPage.OpenPage()
            .TypeUsername("ab")
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(LoginMinLengthMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Short password shows validation error")]
    public void ShouldShowValidationErrorWhenPasswordIsTooShort()
    {
        LoginPage.OpenPage()
            .TypeUsername("user1")
            .TypePassword("123")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(PasswordMinLengthMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Unknown username shows readable error")]
    public void ShouldShowErrorWhenUsernameIsUnknown()
    {
        LoginPage.OpenPage()
            .TypeUsername("nouser")
            .TypePassword("password1")
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(WrongCredentialsMessage);
    }

    [Test]
    [Category("e2e")]
    [Category("negative")]
    [AllureName("Empty username and password show validation error")]
    public void ShouldShowValidationErrorWhenCredentialsAreEmpty()
    {
        LoginPage.OpenPage()
            .SubmitExpectingError()
            .ShouldHaveErrorMessage(BothRequiredMessage);
    }
}
