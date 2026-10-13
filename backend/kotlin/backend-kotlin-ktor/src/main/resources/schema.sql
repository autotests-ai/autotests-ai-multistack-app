CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(512) NOT NULL
);

INSERT INTO items (name, description)
SELECT v.name, v.description
FROM (VALUES
    ('Alpha', 'First seeded item from PostgreSQL'),
    ('Beta', 'Second seeded item for demo API'),
    ('Gamma', 'Third item — multistack bootstrap')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM items);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
