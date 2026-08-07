from __future__ import annotations

from django.http import JsonResponse


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
            from django.http import HttpResponse

            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if request.path.startswith("/api/"):
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response["Access-Control-Allow-Headers"] = "*"
            response["Access-Control-Expose-Headers"] = "Authorization"
        return response
