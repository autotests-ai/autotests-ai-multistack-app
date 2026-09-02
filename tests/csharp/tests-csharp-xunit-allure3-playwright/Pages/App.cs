using Microsoft.Playwright;

namespace Pages;

/// <summary>Facade — one entry for all page objects (Playwright teaching style).</summary>
public sealed class App
{
    public readonly IPage Page;
    public readonly LoginPage Login;
    public readonly RegisterPage Register;
    public readonly HomePage Home;
    public readonly HeaderPage Header;

    public App(IPage page)
    {
        Page = page;
        Login = new LoginPage(page);
        Register = new RegisterPage(page);
        Home = new HomePage(page);
        Header = new HeaderPage(page);
        Login.Header = Header;
        Register.Header = Header;
        Home.Header = Header;
    }
}
