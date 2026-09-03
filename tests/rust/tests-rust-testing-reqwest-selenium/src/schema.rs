use serde_json::Value;

pub fn assert_schema(raw: &[u8], name: &str) {
    let schema_raw = match name {
        "auth-response.json" => include_str!("../schemas/auth-response.json"),
        "error.json" => include_str!("../schemas/error.json"),
        "health.json" => include_str!("../schemas/health.json"),
        "items.json" => include_str!("../schemas/items.json"),
        "profile.json" => include_str!("../schemas/profile.json"),
        other => panic!("unknown schema {other}"),
    };
    let schema: Value = serde_json::from_str(schema_raw).expect(name);
    let data: Value = serde_json::from_slice(raw).unwrap_or_else(|_| {
        panic!("body is not JSON for {name}: {}", String::from_utf8_lossy(raw))
    });
    validate_json(&data, &schema).unwrap_or_else(|err| panic!("{name}: {err}"));
}

fn validate_json(data: &Value, schema: &Value) -> Result<(), String> {
    if let Some(typ) = schema.get("type").and_then(Value::as_str) {
        check_type(data, typ)?;
    }
    match data {
        Value::Object(map) => {
            if let Some(required) = schema.get("required").and_then(Value::as_array) {
                for key in required {
                    let name = key.as_str().unwrap_or_default();
                    if !map.contains_key(name) {
                        return Err(format!("missing required {name:?}"));
                    }
                }
            }
            let props = schema
                .get("properties")
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();
            if schema
                .get("additionalProperties")
                .and_then(Value::as_bool)
                == Some(false)
            {
                for key in map.keys() {
                    if !props.contains_key(key) {
                        return Err(format!("unexpected property {key:?}"));
                    }
                }
            }
            for (key, prop) in &props {
                if let Some(value) = map.get(key) {
                    validate_json(value, prop).map_err(|err| format!("{key}: {err}"))?;
                }
            }
        }
        Value::Array(items) => {
            if let Some(item_schema) = schema.get("items") {
                for (i, item) in items.iter().enumerate() {
                    validate_json(item, item_schema).map_err(|err| format!("[{i}]: {err}"))?;
                }
            }
        }
        Value::String(text) => {
            if let Some(min) = schema.get("minLength").and_then(Value::as_u64) {
                if (text.len() as u64) < min {
                    return Err(format!("string shorter than minLength {min}"));
                }
            }
        }
        _ => {}
    }
    Ok(())
}

fn check_type(data: &Value, typ: &str) -> Result<(), String> {
    let ok = match typ {
        "object" => data.is_object(),
        "array" => data.is_array(),
        "string" => data.is_string(),
        "integer" => data.as_i64().is_some() || data.as_u64().is_some(),
        "number" => data.is_number(),
        "boolean" => data.is_boolean(),
        _ => true,
    };
    if ok {
        Ok(())
    } else {
        Err(format!("want {typ}, got {data}"))
    }
}

pub fn message(body: &serde_json::Map<String, Value>) -> String {
    let msg = body
        .get("message")
        .and_then(serde_json::Value::as_str)
        .unwrap_or("");
    assert!(!msg.is_empty(), "message");
    msg.to_string()
}
