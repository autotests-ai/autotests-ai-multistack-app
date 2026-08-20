from __future__ import annotations

from django.http import HttpResponse, JsonResponse

from api.cors_policy import allowed_origin


class ApiBoundaryMiddleware:
    """
    The reference security chain authenticates every /api/** path before routing, so a
    method no view accepts answers 401 instead of advertising which methods exist.
    Unmapped /api/** paths are handled by the catch-all route in `api.urls`.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code == 405 and request.path.startswith("/api/"):
            return JsonResponse({"message": "Unauthorized"}, status=401)
        return response


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if request.path.startswith("/api/"):
            origin = allowed_origin(
                request.headers.get("Origin"), request.get_host()
            )
            if origin:
                response["Access-Control-Allow-Origin"] = origin
                response["Access-Control-Allow-Methods"] = (
                    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                )
                response["Access-Control-Allow-Headers"] = (
                    "Authorization, Content-Type"
                )
                response["Access-Control-Expose-Headers"] = "Authorization"
        return response
