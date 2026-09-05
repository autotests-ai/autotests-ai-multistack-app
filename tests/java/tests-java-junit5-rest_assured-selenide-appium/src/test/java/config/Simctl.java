package config;

import org.openqa.selenium.json.Json;
import org.openqa.selenium.json.JsonException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Simulator twin of {@link Adb}. Without {@code appium:udid} the XCUITest
 * driver falls back to the newest SDK Xcode carries and creates a throwaway
 * simulator for the run — a slow boot on a runtime nobody tested the app on.
 */
final class Simctl {

    private static final String IOS_RUNTIME = "com.apple.CoreSimulator.SimRuntime.iOS-";

    private Simctl() {
    }

    static String udid(String deviceName) {
        String explicit = MobileConfig.iosUdid();
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }
        List<Simulator> booted = bootedIosSimulators();
        // Falling back to any booted simulator is the throwaway-runtime bug wearing
        // a different hat: the suite would pass on a device nobody asked for.
        return booted.stream()
                .filter(simulator -> simulator.name().equals(deviceName))
                .findFirst()
                .orElseThrow(() -> notBooted(deviceName, booted))
                .udid();
    }

    private static IllegalStateException notBooted(String deviceName, List<Simulator> booted) {
        String boot = "xcrun simctl boot \"" + deviceName + "\"";
        if (booted.isEmpty()) {
            return new IllegalStateException(
                    "No booted iOS simulator. Boot the one this suite expects — " + boot
                            + " — or Simulator.app, then retry.");
        }
        return new IllegalStateException(
                "No booted iOS simulator named \"" + deviceName + "\". Booted now:\n"
                        + booted.stream().map(Simulator::describe)
                                .collect(Collectors.joining("\n"))
                        + "\nBoot it (" + boot + "), or point the suite at one of the above "
                        + "with IOS_DEVICE_NAME= / IOS_UDID=.");
    }

    /**
     * The {@code --json} shape, not the human table: a device name repeats across
     * runtimes ({@code iPhone 16} on both 18.3 and 18.4), and only the runtime key
     * says which one is booted.
     */
    private static List<Simulator> bootedIosSimulators() {
        String json = run("xcrun", "simctl", "list", "devices", "--json");
        Map<?, ?> root;
        try {
            root = new Json().toType(json, Map.class);
        } catch (JsonException e) {
            throw new IllegalStateException("`simctl list devices --json` is not JSON: " + json, e);
        }
        if (!(root.get("devices") instanceof Map<?, ?> byRuntime)) {
            throw new IllegalStateException("`simctl list devices --json` has no devices: " + json);
        }
        List<Simulator> booted = new ArrayList<>();
        for (Map.Entry<?, ?> runtime : byRuntime.entrySet()) {
            String identifier = String.valueOf(runtime.getKey());
            // watchOS and tvOS simulators carry udids too, and cannot run the app.
            if (!identifier.startsWith(IOS_RUNTIME)
                    || !(runtime.getValue() instanceof List<?> devices)) {
                continue;
            }
            for (Object device : devices) {
                if (device instanceof Map<?, ?> fields && "Booted".equals(fields.get("state"))) {
                    booted.add(new Simulator(
                            String.valueOf(fields.get("name")),
                            String.valueOf(fields.get("udid")),
                            iosVersion(identifier)));
                }
            }
        }
        return booted;
    }

    /** Stderr inherits the console so a warning cannot land inside the JSON. */
    private static String run(String... command) {
        ProcessBuilder builder = new ProcessBuilder(command)
                .redirectError(ProcessBuilder.Redirect.INHERIT);
        String developerDir = developerDir();
        if (developerDir != null) {
            builder.environment().put("DEVELOPER_DIR", developerDir);
        }
        try {
            Process process = builder.start();
            String output = new String(
                    process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int status = process.waitFor();
            if (status != 0) {
                throw new IllegalStateException(
                        String.join(" ", command) + " exited " + status + " (see stderr above).");
            }
            return output;
        } catch (IOException e) {
            throw new IllegalStateException(
                    "xcrun simctl is not available. This cell needs full Xcode, not "
                            + "CommandLineTools; DEVELOPER_DIR= overrides the lookup.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted waiting for " + String.join(" ", command), e);
        }
    }

    /** {@code …SimRuntime.iOS-18-3} the way {@code simctl list runtimes} prints it. */
    private static String iosVersion(String runtimeIdentifier) {
        return "iOS " + runtimeIdentifier.substring(IOS_RUNTIME.length()).replace('-', '.');
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

    private record Simulator(String name, String udid, String runtime) {

        String describe() {
            return "  " + name + " (" + runtime + ") " + udid;
        }
    }
}
