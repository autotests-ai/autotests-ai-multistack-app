package config;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Simulator twin of {@link Adb}. Without {@code appium:udid} the XCUITest
 * driver falls back to the newest SDK Xcode carries and creates a throwaway
 * simulator for the run — a slow boot on a runtime nobody tested the app on.
 */
final class Simctl {

    private static final Pattern IOS_RUNTIME = Pattern.compile("^-- iOS .+ --$");
    private static final Pattern OTHER_RUNTIME = Pattern.compile("^-- .+ --$");
    private static final Pattern DEVICE = Pattern.compile(
            "^(?<name>.+) \\((?<udid>[0-9A-Fa-f-]{36})\\) \\((?<state>[^()]+)\\)$");

    private Simctl() {
    }

    static String udid(String deviceName) {
        String explicit = MobileConfig.iosUdid();
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }
        List<Simulator> booted = bootedSimulators();
        if (booted.isEmpty()) {
            throw new IllegalStateException(
                    "No booted iOS simulator in `xcrun simctl list devices`. Boot one "
                            + "(`xcrun simctl boot \"" + deviceName + "\"` or Simulator.app), "
                            + "then retry. IOS_UDID= pins a specific device.");
        }
        return booted.stream()
                .filter(simulator -> simulator.name().equals(deviceName))
                .findFirst()
                .orElse(booted.get(0))
                .udid();
    }

    private static List<Simulator> bootedSimulators() {
        List<Simulator> booted = new ArrayList<>();
        boolean ios = false;
        for (String line : run("xcrun", "simctl", "list", "devices", "available")) {
            String trimmed = line.strip();
            if (OTHER_RUNTIME.matcher(trimmed).matches()) {
                // watchOS and tvOS devices carry udids too, and cannot run the app.
                ios = IOS_RUNTIME.matcher(trimmed).matches();
                continue;
            }
            Matcher device = DEVICE.matcher(trimmed);
            if (ios && device.matches() && "Booted".equals(device.group("state"))) {
                booted.add(new Simulator(device.group("name"), device.group("udid")));
            }
        }
        return booted;
    }

    private static List<String> run(String... command) {
        ProcessBuilder builder = new ProcessBuilder(command).redirectErrorStream(true);
        String developerDir = developerDir();
        if (developerDir != null) {
            builder.environment().put("DEVELOPER_DIR", developerDir);
        }
        try {
            Process process = builder.start();
            List<String> lines = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    lines.add(line);
                }
            }
            process.waitFor();
            return lines;
        } catch (Exception e) {
            throw new IllegalStateException(
                    "xcrun simctl is not available. This cell needs full Xcode, not "
                            + "CommandLineTools; DEVELOPER_DIR= overrides the lookup.", e);
        }
    }

    /** CommandLineTools carries no simctl, so `xcode-select -p` may point nowhere useful. */
    private static String developerDir() {
        String configured = System.getenv("DEVELOPER_DIR");
        if (configured != null && !configured.isBlank()) {
            return configured;
        }
        Path xcodeApp = Path.of("/Applications/Xcode.app/Contents/Developer");
        return Files.isDirectory(xcodeApp) ? xcodeApp.toString() : null;
    }

    private record Simulator(String name, String udid) {
    }
}
