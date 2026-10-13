package api;

import com.networknt.schema.Error;
import com.networknt.schema.InputFormat;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SpecificationVersion;

import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

public final class JsonSchemas {

    private static final SchemaRegistry REGISTRY =
            SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_7);

    private JsonSchemas() {
    }

    public static void assertMatches(String body, String name) {
        InputStream stream = JsonSchemas.class.getResourceAsStream("/schemas/" + name);
        if (stream == null) {
            throw new IllegalStateException("missing classpath schema " + name);
        }
        List<Error> errors;
        try {
            errors = REGISTRY.getSchema(stream).validate(body, InputFormat.JSON);
        } catch (RuntimeException e) {
            throw new IllegalStateException(name + " not JSON: " + body, e);
        }
        assertTrue(errors.isEmpty(), () -> name + ": "
                + errors.stream().map(Error::getMessage).collect(Collectors.joining("; "))
                + " — " + body);
    }
}
