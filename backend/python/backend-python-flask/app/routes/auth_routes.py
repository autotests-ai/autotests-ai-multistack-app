from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth import check_password, hash_password, require_auth, validate_credentials
from app.config import Config
from app.db import SessionLocal
from app.jwt_util import create_token
from app.models import User

auth_bp = Blueprint("auth", __name__)


def _auth_response(username: str):
    return {
        "token": create_token(username),
        "username": username,
        "redirectUrl": Config.POST_AUTH_REDIRECT,
    }


def _json_object():
    """The parsed body, or None when it never was a JSON object (unreadable or a list)."""
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


@auth_bp.post("/register")
def register():
    body = _json_object()
    if body is None:
        return jsonify({"message": "Request body is not valid JSON"}), 400
    error = validate_credentials(body.get("username"), body.get("password"))
    if error:
        return jsonify({"message": error}), 400

    username = body["username"]
    password = body["password"]
    with SessionLocal() as session:
        if session.scalar(select(User).where(User.username == username)):
            return jsonify({"message": "Username already taken"}), 409
        session.add(User(username=username, password_hash=hash_password(password)))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            return jsonify({"message": "Username already taken"}), 409
    return jsonify(_auth_response(username)), 201


@auth_bp.post("/login")
def login():
    body = _json_object()
    if body is None:
        return jsonify({"message": "Request body is not valid JSON"}), 400
    error = validate_credentials(body.get("username"), body.get("password"))
    if error:
        return jsonify({"message": error}), 400

    username = body["username"]
    password = body["password"]
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.username == username))
        if user is None or not check_password(password, user.password_hash):
            return jsonify({"message": "Wrong login or password"}), 401
    return jsonify(_auth_response(username))


@auth_bp.post("/logout")
def logout():
    return ("", 204)


@auth_bp.get("/me")
def me():
    denied = require_auth()
    if denied is not None:
        return denied
    return jsonify({"username": g.username})


# Authenticated self-delete. Tokens are stateless: a JWT issued earlier keeps verifying after
# deletion, but every endpoint that resolves the user answers 401 once the row is gone.
@auth_bp.delete("/me")
def delete_account():
    denied = require_auth()
    if denied is not None:
        return denied

    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.username == g.username))
        session.delete(user)
        session.commit()
    return ("", 204)
