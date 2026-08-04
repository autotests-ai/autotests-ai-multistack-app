from __future__ import annotations

import json

from django.conf import settings
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.auth import check_password, hash_password, validate_credentials
from api.jwt_util import create_token, extract_username
from api.models import Item, User


def _json_body(request) -> dict:
    if not request.body:
        return {}
    try:
        data = json.loads(request.body.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _auth_response(username: str) -> dict:
    return {
        "token": create_token(username),
        "username": username,
        "redirectUrl": settings.POST_AUTH_REDIRECT,
    }


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


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    body = _json_body(request)
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


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    body = _json_body(request)
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


@csrf_exempt
@require_http_methods(["POST"])
def logout(_request):
    return HttpResponse(status=204)


@require_GET
def me(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return JsonResponse({"message": "Unauthorized"}, status=401)
    username = extract_username(header[7:])
    if not username or not User.objects.filter(username=username).exists():
        return JsonResponse({"message": "Unauthorized"}, status=401)
    return JsonResponse({"username": username})
