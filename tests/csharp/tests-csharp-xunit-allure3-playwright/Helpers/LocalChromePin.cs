using Config;

namespace Helpers;

/// <summary>
/// Pins local Chrome to the Chrome for Testing build in <c>chrome-for-testing.properties</c>.
/// Playwright launches that binary via <c>ExecutablePath</c> — system Chrome and bundled
/// Chromium are never used. Chromedriver is not required (Playwright talks CDP).
/// </summary>
public static class LocalChromePin
{
    private const string PinFile = "chrome-for-testing.properties";
    private const string Installer = "scripts/install-chrome-for-testing.sh";

    private static string? _appliedBinary;

    public static string Apply(string? browserVersion)
    {
        if (string.IsNullOrWhiteSpace(browserVersion))
        {
            throw new InvalidOperationException(
                "browserVersion is required for local Chrome (canon: 148). "
                + "Do not run e2e on system Chrome without explicit override.");
        }

        var version = PinnedVersion();
        RequireSameMajor(browserVersion, version);

        var chrome = ExecutableOverride("CHROME_BINARY_PATH") ?? ChromeBinary(version);
        if (!File.Exists(chrome))
        {
            throw NotInstalled($"Chrome {version} browser binary", chrome);
        }

        _appliedBinary = chrome;
        return chrome;
    }

    public static string ChromeExecutable() =>
        _appliedBinary ?? throw new InvalidOperationException("LocalChromePin.Apply() was not called");

    public static string PinnedVersion()
    {
        var overrideVersion = Environment.GetEnvironmentVariable("CHROME_FOR_TESTING_VERSION")?.Trim();
        if (!string.IsNullOrWhiteSpace(overrideVersion))
        {
            return overrideVersion;
        }

        var path = PinPath();
        if (!File.Exists(path))
        {
            throw new InvalidOperationException($"{PinFile} is missing from the tests module");
        }

        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (!trimmed.StartsWith("version=", StringComparison.Ordinal))
            {
                continue;
            }

            var version = trimmed["version=".Length..].Trim();
            if (version.Length > 0)
            {
                return version;
            }
        }

        throw new InvalidOperationException($"No version= entry in {PinFile}");
    }

    private static string PinPath()
    {
        var fromOutput = Path.Combine(AppContext.BaseDirectory, PinFile);
        if (File.Exists(fromOutput))
        {
            return fromOutput;
        }

        return Path.Combine(Config.ConfigFiles.ModuleDir(), PinFile);
    }

    private static string? ExecutableOverride(string environmentVariable)
    {
        var value = Environment.GetEnvironmentVariable(environmentVariable);
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void RequireSameMajor(string browserVersion, string pinnedVersion)
    {
        var requested = Major(browserVersion);
        var pinned = Major(pinnedVersion);
        if (requested != pinned)
        {
            throw new InvalidOperationException(
                $"browserVersion={browserVersion} asks for Chrome {requested}, but the pinned build is {pinnedVersion}. "
                + $"Align them: bump version= in {PinFile}, or set browserVersion to {pinned}.");
        }
    }

    private static string Major(string version) => version.Split('.')[0];

    private static string ChromeForTestingRoot()
    {
        var overridePath = Environment.GetEnvironmentVariable("CHROME_FOR_TESTING_PATH");
        if (!string.IsNullOrWhiteSpace(overridePath))
        {
            return overridePath.Trim();
        }

        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".local", "share", "chrome-for-testing");
    }

    private static string PlatformDir()
    {
        if (OperatingSystem.IsMacOS())
        {
            return System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture
                is System.Runtime.InteropServices.Architecture.Arm64
                ? "mac_arm"
                : "mac";
        }

        if (OperatingSystem.IsLinux())
        {
            return "linux";
        }

        throw new InvalidOperationException($"Unsupported OS for LocalChromePin: {Environment.OSVersion}");
    }

    private static string ChromeBinary(string version)
    {
        var versionDir = Path.Combine(ChromeForTestingRoot(), "chrome", $"{PlatformDir()}-{version}");
        return PlatformDir() switch
        {
            "mac_arm" => Path.Combine(versionDir, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
            "mac" => Path.Combine(versionDir, "chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
            "linux" => Path.Combine(versionDir, "chrome-linux64", "chrome"),
            _ => throw new InvalidOperationException($"Unsupported platform: {PlatformDir()}"),
        };
    }

    private static InvalidOperationException NotInstalled(string what, string expected) =>
        new(
            $"{what} not found at {expected}. "
            + $"Install the pinned build (not system Chrome), from the tests module root:\n  {Installer}");
}
