package api;

import api.model.ErrorEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.io.UncheckedIOException;

public final class Calls {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private Calls() {
    }

    public static <T> Response<T> execute(Call<T> call) {
        try {
            return call.execute();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static String errorMessage(Response<?> response) {
        try {
            var raw = response.errorBody();
            if (raw == null) {
                return "";
            }
            var json = raw.string();
            if (json.isBlank()) {
                return "";
            }
            var message = MAPPER.readValue(json, ErrorEnvelope.class).message();
            return message == null ? "" : message;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
