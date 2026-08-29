package api;

import okhttp3.MediaType;
import okhttp3.RequestBody;

public final class RawJson {

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private RawJson() {
    }

    public static RequestBody body(String raw) {
        return RequestBody.create(raw, JSON);
    }
}
