package helpers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TokensCss {

    private static final Pattern ROOT_BLOCK =
            Pattern.compile(":root\\s*\\{([^}]+)\\}", Pattern.DOTALL);
    private static final Pattern TOKEN =
            Pattern.compile("(--[\\w-]+)\\s*:\\s*([^;]+);");

    private TokensCss() {
    }

    public static Path defaultTokensPath() {
        // cwd = tests module root (ethalon nested vs takeaway flat vendor/)
        return firstExisting(tokensCssCandidates());
    }

    private static Path[] tokensCssCandidates() {
        return new Path[] {
                frontendTokens("..", "..", "..", "frontend", "_shared", "frontend-javascript-app"),
                frontendTokens("frontend", "_shared", "frontend-javascript-app"),
                frontendTokens("..", "frontend-typescript-react", "vendor", "frontend-javascript-app"),
                frontendTokens("frontend-typescript-react", "vendor", "frontend-javascript-app"),
                backendTokens("..", "..", "..", "backend", "java", "backend-java-spring"),
                backendTokens("backend", "java", "backend-java-spring"),
                backendTokens("..", "backend-java-spring"),
                backendTokens("backend-java-spring"),
        };
    }

    public static Path firstExisting(Path... candidates) {
        Path fallback = candidates[candidates.length - 1].normalize().toAbsolutePath();
        for (var candidate : candidates) {
            var abs = candidate.normalize().toAbsolutePath();
            if (Files.exists(abs)) {
                return abs;
            }
            fallback = abs;
        }
        return fallback;
    }

    public static Path resolveTokensCssPath(Path frontendCandidate, Path backendCandidate) {
        if (Files.exists(frontendCandidate)) {
            return frontendCandidate;
        }
        return backendCandidate;
    }

    public static Map<String, String> parseRootTokens(Path cssFile) throws Exception {
        var css = Files.readString(cssFile);
        var match = ROOT_BLOCK.matcher(css);
        if (!match.find()) {
            throw new IllegalArgumentException(":root block not found in " + cssFile);
        }
        var tokens = new LinkedHashMap<String, String>();
        Matcher tokenMatcher = TOKEN.matcher(match.group(1));
        while (tokenMatcher.find()) {
            tokens.put(tokenMatcher.group(1), tokenMatcher.group(2).trim());
        }
        return tokens;
    }

    private static Path frontendTokens(String... moduleRoot) {
        return join(moduleRoot, "css", "tokens.css");
    }

    private static Path backendTokens(String... moduleRoot) {
        return join(moduleRoot, "src", "main", "resources", "static", "css", "tokens.css");
    }

    private static Path join(String[] prefix, String... suffix) {
        var parts = Arrays.copyOf(prefix, prefix.length + suffix.length);
        System.arraycopy(suffix, 0, parts, prefix.length, suffix.length);
        return Path.of(parts[0], Arrays.copyOfRange(parts, 1, parts.length));
    }
}
