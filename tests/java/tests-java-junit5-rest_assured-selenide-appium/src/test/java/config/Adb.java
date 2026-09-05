package config;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

final class Adb {

    private Adb() {
    }

    static String udid(DeviceHost host) {
        String explicit = MobileConfig.androidUdid();
        if (explicit != null && !explicit.isBlank()) {
            requireHostKind(host, explicit);
            return explicit;
        }
        List<String> serials = devices();
        List<String> emulators = serials.stream().filter(Adb::isEmulator).toList();
        List<String> phones = serials.stream().filter(s -> !isEmulator(s)).toList();
        if (host == DeviceHost.EMULATOR) {
            if (emulators.isEmpty()) {
                throw new IllegalStateException(
                        "No Android emulator in `adb devices`. Start an AVD, then retry.");
            }
            return emulators.get(0);
        }
        if (phones.isEmpty()) {
            throw new IllegalStateException(
                    "No real Android device in `adb devices`. Plug in a phone with USB debugging.");
        }
        return phones.get(0);
    }

    private static void requireHostKind(DeviceHost host, String serial) {
        if (host == DeviceHost.REAL && isEmulator(serial)) {
            throw new IllegalStateException(
                    "ANDROID_UDID=" + serial + " is an emulator. ./gradlew real needs a USB phone.");
        }
        if (host == DeviceHost.EMULATOR && !isEmulator(serial)) {
            throw new IllegalStateException(
                    "ANDROID_UDID=" + serial + " is not an emulator. ./gradlew emulator needs an AVD.");
        }
    }

    private static boolean isEmulator(String serial) {
        return serial.startsWith("emulator-");
    }

    private static String adbBinary() {
        String home = firstNonBlank(System.getenv("ANDROID_HOME"), System.getenv("ANDROID_SDK_ROOT"));
        if (home != null) {
            Path sdkAdb = Path.of(home, "platform-tools", "adb");
            if (Files.isRegularFile(sdkAdb)) {
                return sdkAdb.toString();
            }
        }
        Path macDefault = Path.of(
                System.getProperty("user.home"),
                "Library", "Android", "sdk", "platform-tools", "adb");
        if (Files.isRegularFile(macDefault)) {
            return macDefault.toString();
        }
        return "adb";
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static List<String> devices() {
        try {
            Process process = new ProcessBuilder(adbBinary(), "devices")
                    .redirectErrorStream(true)
                    .start();
            List<String> serials = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean skipHeader = true;
                while ((line = reader.readLine()) != null) {
                    if (skipHeader) {
                        skipHeader = false;
                        continue;
                    }
                    String[] parts = line.trim().split("\\s+");
                    if (parts.length >= 2 && "device".equals(parts[1])) {
                        serials.add(parts[0]);
                    }
                }
            }
            process.waitFor();
            return serials;
        } catch (Exception e) {
            throw new IllegalStateException("adb is not available; install Android platform-tools", e);
        }
    }
}
