package config;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

final class Adb {

    private Adb() {
    }

    static String udid(DeviceHost host) {
        String explicit = MobileConfig.androidUdid();
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }
        List<String> serials = devices();
        List<String> emulators = serials.stream().filter(s -> s.startsWith("emulator-")).toList();
        List<String> phones = serials.stream().filter(s -> !s.startsWith("emulator-")).toList();
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

    private static List<String> devices() {
        try {
            Process process = new ProcessBuilder("adb", "devices")
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
