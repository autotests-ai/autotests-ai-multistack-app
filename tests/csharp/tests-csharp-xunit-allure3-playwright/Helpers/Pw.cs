namespace Helpers;

/// <summary>Playwright for .NET is async-only; tests stay Java-shaped (sync steps).</summary>
internal static class Pw
{
    public static void Run(Task task) => task.GetAwaiter().GetResult();

    public static T Run<T>(Task<T> task) => task.GetAwaiter().GetResult();
}
