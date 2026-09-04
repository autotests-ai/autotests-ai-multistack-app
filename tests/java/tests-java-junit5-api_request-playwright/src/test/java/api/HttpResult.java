package api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

public record HttpResult(int status, String body) {

    static final ObjectMapper MAPPER = new ObjectMapper();

    public JsonNode json() {
        try {
            return MAPPER.readTree(body == null || body.isBlank() ? "{}" : body);
        } catch (Exception e) {
            throw new IllegalStateException("not JSON: " + body, e);
        }
    }

    public String text(String field) {
        return json().path(field).asText();
    }

    public List<String> itemNames() {
        List<String> names = new ArrayList<>();
        for (JsonNode item : json().path("items")) {
            names.add(item.path("name").asText());
        }
        return names;
    }
}
