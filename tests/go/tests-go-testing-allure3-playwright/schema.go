package tests

import (
	"embed"
	"encoding/json"
	"fmt"
	"math"
	"testing"

	"github.com/stretchr/testify/require"
)

//go:embed schemas/*.json
var schemaFS embed.FS

func AssertSchema(t *testing.T, raw []byte, name string) {
	t.Helper()
	schemaRaw, err := schemaFS.ReadFile("schemas/" + name)
	require.NoError(t, err, name)
	var schema map[string]any
	require.NoError(t, json.Unmarshal(schemaRaw, &schema))
	var data any
	require.NoError(t, json.Unmarshal(raw, &data), string(raw))
	require.NoError(t, validateJSON(data, schema), name)
}

func validateJSON(data any, schema map[string]any) error {
	if typ, ok := schema["type"].(string); ok {
		if err := checkType(data, typ); err != nil {
			return err
		}
	}
	switch typed := data.(type) {
	case map[string]any:
		if req, ok := schema["required"].([]any); ok {
			for _, key := range req {
				name, _ := key.(string)
				if _, ok := typed[name]; !ok {
					return fmt.Errorf("missing required %q", name)
				}
			}
		}
		props, _ := schema["properties"].(map[string]any)
		if additional, ok := schema["additionalProperties"].(bool); ok && !additional {
			for key := range typed {
				if _, ok := props[key]; !ok {
					return fmt.Errorf("unexpected property %q", key)
				}
			}
		}
		for key, prop := range props {
			value, ok := typed[key]
			if !ok {
				continue
			}
			propSchema, _ := prop.(map[string]any)
			if err := validateJSON(value, propSchema); err != nil {
				return fmt.Errorf("%s: %w", key, err)
			}
		}
	case []any:
		itemSchema, _ := schema["items"].(map[string]any)
		if itemSchema == nil {
			return nil
		}
		for i, item := range typed {
			if err := validateJSON(item, itemSchema); err != nil {
				return fmt.Errorf("[%d]: %w", i, err)
			}
		}
	case string:
		if min, ok := schema["minLength"].(float64); ok && len(typed) < int(min) {
			return fmt.Errorf("string shorter than minLength %v", min)
		}
	}
	return nil
}

func checkType(data any, typ string) error {
	switch typ {
	case "object":
		if _, ok := data.(map[string]any); !ok {
			return fmt.Errorf("want object, got %T", data)
		}
	case "array":
		if _, ok := data.([]any); !ok {
			return fmt.Errorf("want array, got %T", data)
		}
	case "string":
		if _, ok := data.(string); !ok {
			return fmt.Errorf("want string, got %T", data)
		}
	case "integer":
		n, ok := data.(float64)
		if !ok || n != math.Trunc(n) {
			return fmt.Errorf("want integer, got %T", data)
		}
	case "number":
		if _, ok := data.(float64); !ok {
			return fmt.Errorf("want number, got %T", data)
		}
	case "boolean":
		if _, ok := data.(bool); !ok {
			return fmt.Errorf("want boolean, got %T", data)
		}
	}
	return nil
}

func Message(t *testing.T, body map[string]any) string {
	t.Helper()
	msg, _ := body["message"].(string)
	require.NotEmpty(t, msg)
	return msg
}
