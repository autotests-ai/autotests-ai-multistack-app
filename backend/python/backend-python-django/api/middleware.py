from __future__ import annotations


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
