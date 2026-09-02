using System.Text.RegularExpressions;

namespace Helpers;

public static class LayoutCss
{
    /// <summary>Must match <c>@media (max-width: …)</c> in frontend/css/header.css.</summary>
    public const int ResponsiveBreakpointPx = 768;

    /// <summary>Desktop layout starts at breakpoint + 1px.</summary>
    public const int WideLayoutMinViewportPx = ResponsiveBreakpointPx + 1;

    private static readonly Regex RepeatColumns = new(@"repeat\((\d+)", RegexOptions.Compiled);

    public static int GridColumnCount(string? gridTemplateColumns)
    {
        if (string.IsNullOrWhiteSpace(gridTemplateColumns) || gridTemplateColumns.Trim() == "none")
        {
            return 0;
        }

        var normalized = gridTemplateColumns.Trim();
        var match = RepeatColumns.Match(normalized);
        if (match.Success)
        {
            return int.Parse(match.Groups[1].Value);
        }

        return normalized.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
    }
}
