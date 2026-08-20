from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from app.db import apply_schema
from app.routes.api import api_bp
from app.routes.auth_routes import auth_bp
from app.seed import seed_data


def create_app(*, init_db: bool = True) -> Flask:
    # Bearer JWT, stateless — Flask has no cookie CSRF. Same as Java SecurityConfig
    # @SuppressWarnings("java:S4502").
    app = Flask(__name__)  # NOSONAR
    CORS(
        app,
        resources={
            r"/api/*": {
                # Teaching UI is another origin (Vite / path-routed nginx). Auth is
                # Bearer JWT, not cookies — same as Java CorsConfig, wildcard for siblings.
                "origins": "*",  # NOSONAR
                "expose_headers": ["Authorization"],
            }
        },
        supports_credentials=False,
    )
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # The reference security chain authenticates every /api/** path, so an unmapped one
    # answers 401 — a client must not learn which API paths exist.
    def unmapped(error):
        if request.path.startswith("/api/"):
            return jsonify({"message": "Unauthorized"}), 401
        return jsonify({"message": error.name}), error.code

    app.register_error_handler(404, unmapped)
    app.register_error_handler(405, unmapped)

    if init_db:
        apply_schema()
        seed_data()

    return app
