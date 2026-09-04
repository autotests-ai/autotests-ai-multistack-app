package api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;

import java.io.InputStream;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

public final class JsonSchemas {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final JsonSchemaFactory FACTORY = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);

    private JsonSchemas() {
    }

    public static void assertMatches(String body, String name) {
        InputStream stream = JsonSchemas.class.getResourceAsStream("/schemas/" + name);
        if (stream == null) {
            throw new IllegalStateException("missing classpath schema " + name);
        }
        JsonNode node;
        try {
            node = MAPPER.readTree(body);
        } catch (Exception e) {
            throw new IllegalStateException(name + " not JSON: " + body, e);
        }
        Set<ValidationMessage> errors = FACTORY.getSchema(stream).validate(node);
        assertTrue(errors.isEmpty(), () -> name + ": "
                + errors.stream().map(ValidationMessage::getMessage).collect(Collectors.joining("; "))
                + " — " + body);
    }
}
