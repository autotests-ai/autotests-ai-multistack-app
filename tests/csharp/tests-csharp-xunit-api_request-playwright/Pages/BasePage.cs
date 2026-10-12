using Api;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public abstract class BasePage<T> where T : BasePage<T>
{
    private const string AuthTokenKeyJs =
        """
        () => {
          const m = location.pathname.match(/\/(backend-[^/]+)\//);
          return m ? `authToken:${m[1]}` : 'authToken';
        }
        """;

    protected readonly IPage _page;

    protected BasePage(IPage page)
    {
        _page = page;
    }

    public abstract T ShouldBeOpen();

    protected string Authenticate(string username, string password) => AuthApiClient.Login(username, password);

    protected void OpenPageWithLocalStorageToken(string pagePath, string token)
    {
        Pw.Run(_page.GotoAsync("icons/qa-guru-logo.svg"));
        Pw.Run(_page.EvaluateAsync(
            "arg => localStorage.setItem(arg.key, arg.token)",
            new { key = AuthTokenKey(), token }));
        Pw.Run(_page.GotoAsync(pagePath));
    }

    protected void WaitForAuthTokenToBeCleared() =>
        Pw.Run(_page.WaitForFunctionAsync("() => localStorage.getItem((" + AuthTokenKeyJs + ")()) === null"));

    protected void VerifyAuthTokenPresent() => Xunit.Assert.NotNull(AuthToken());

    public string AuthTokenKey() => Pw.Run(_page.EvaluateAsync<string>(AuthTokenKeyJs)) ?? "authToken";

    public string? AuthToken() =>
        Pw.Run(_page.EvaluateAsync<string?>("k => localStorage.getItem(k)", AuthTokenKey()));
}
