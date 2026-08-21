from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.auth import check_password, hash_password, validate_credentials
from api.jwt_util import create_token, extract_username
from api.models import Item, User

_RESOURCES = Path(__file__).resolve().parent.parent / "resources"


def _resource(name: str) -> bytes:
    return (_RESOURCES / name).read_bytes()


def jwt_csrf_exempt(view):
    """JSON API: Bearer JWT, no ambient cookie. Same as Java SecurityConfig S4502."""
    return csrf_exempt(view)  # NOSONAR


def _json_body(request) -> dict | None:
    """The parsed body, or None when it never was a JSON object (unreadable or a list)."""
    try:
        data = json.loads(request.body.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _unreadable_body() -> JsonResponse:
    return JsonResponse({"message": "Request body is not valid JSON"}, status=400)


def _auth_response(username: str) -> dict:
    return {
        "token": create_token(username),
        "username": username,
        "redirectUrl": settings.POST_AUTH_REDIRECT,
    }


@require_GET
def openapi_spec(_request):
    return HttpResponse(_resource("openapi.yaml"), content_type="application/yaml")


@require_GET
def openapi_docs(_request):
    return HttpResponse(_resource("openapi-docs.html"), content_type="text/html")


@require_GET
def health(_request):
    return JsonResponse({"status": "ok", "service": settings.SERVICE_NAME})


@require_GET
def items(_request):
    payload = [
        {"id": item.id, "name": item.name, "description": item.description}
        for item in Item.objects.order_by("id")
    ]
    return JsonResponse({"items": payload, "source": "postgresql"})


@jwt_csrf_exempt
@require_http_methods(["POST"])
def register(request):
    body = _json_body(request)
    if body is None:
        return _unreadable_body()
    error = validate_credentials(body.get("username"), body.get("password"))
    if error:
        return JsonResponse({"message": error}, status=400)

    username = body["username"]
    password = body["password"]
    if User.objects.filter(username=username).exists():
        return JsonResponse({"message": "Username already taken"}, status=409)
    try:
        User.objects.create(
            username=username,
            password_hash=hash_password(password),
        )
    except IntegrityError:
        return JsonResponse({"message": "Username already taken"}, status=409)
    return JsonResponse(_auth_response(username), status=201)


@jwt_csrf_exempt
@require_http_methods(["POST"])
def login(request):
    body = _json_body(request)
    if body is None:
        return _unreadable_body()
    error = validate_credentials(body.get("username"), body.get("password"))
    if error:
        return JsonResponse({"message": error}, status=400)

    username = body["username"]
    password = body["password"]
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"message": "Wrong login or password"}, status=401)
    if not check_password(password, user.password_hash):
        return JsonResponse({"message": "Wrong login or password"}, status=401)
    return JsonResponse(_auth_response(username))


@jwt_csrf_exempt
@require_http_methods(["POST"])
def logout(_request):
    return HttpResponse(status=204)


def _authenticated_username(request) -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    username = extract_username(header[7:])
    if not username or not User.objects.filter(username=username).exists():
        return None
    return username


# GET and DELETE share one view: Django routes by path, and the 401 for an anonymous caller
# must win over the 405 that a method-restricted view would answer first.
# DELETE is the authenticated self-delete — tokens are stateless, so a JWT issued earlier keeps
# verifying after deletion, but this view answers 401 once the row is gone.
@jwt_csrf_exempt
@require_http_methods(["GET", "DELETE"])
def me(request):
    username = _authenticated_username(request)
    if username is None:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    if request.method == "DELETE":
        User.objects.filter(username=username).delete()
        return HttpResponse(status=204)
    return JsonResponse({"username": username})


# The reference security chain authenticates every /api/** path before routing, so an
# unmapped one answers 401 — a client must not learn which API paths exist.
@jwt_csrf_exempt
@require_http_methods(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def unmapped(_request):
    return JsonResponse({"message": "Unauthorized"}, status=401)
