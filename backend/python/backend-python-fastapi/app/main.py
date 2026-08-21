from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import Config
from app.cors_policy import CorsPolicyMiddleware
from app.db import SessionLocal, apply_schema
from app.jwt_util import create_token
from app.models import Item, User
from app.schemas import (
    AuthResponse,
    Credentials,
    HealthResponse,
    ItemDto,
    ItemsResponse,
    UserProfileResponse,
)
from app.security import check_password, current_username, hash_password
from app.seed import seed_data
from app.validation import validation_message


_RESOURCES = Path(__file__).resolve().parent.parent / "resources"


def _resource(name: str) -> bytes:
    return (_RESOURCES / name).read_bytes()


def create_app(*, init_db: bool = True) -> FastAPI:
    # openapi_url=None: generated get_openapi is not SSOT — serve _contract yaml instead.
    app = FastAPI(
        title=Config.SERVICE_NAME,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.add_middleware(CorsPolicyMiddleware)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict) and "message" in exc.detail:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        message = exc.detail if isinstance(exc.detail, str) else "Error"
        return JSONResponse(status_code=exc.status_code, content={"message": message})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=400,
            content={"message": validation_message(exc.errors())},
        )

    @app.get("/api/openapi.yaml", include_in_schema=False)
    def openapi_spec() -> Response:
        return Response(content=_resource("openapi.yaml"), media_type="application/yaml")

    @app.get("/api/docs", include_in_schema=False)
    def openapi_docs() -> Response:
        return Response(
            content=_resource("openapi-docs.html"), media_type="text/html"
        )

    @app.get("/api/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok", service=Config.SERVICE_NAME)

    @app.get("/api/items", response_model=ItemsResponse)
    def items() -> ItemsResponse:
        with SessionLocal() as session:
            rows = session.scalars(select(Item).order_by(Item.id)).all()
            payload = [
                ItemDto(id=row.id, name=row.name, description=row.description)
                for row in rows
            ]
        return ItemsResponse(items=payload, source="postgresql")

    def _auth_response(username: str) -> AuthResponse:
        return AuthResponse(
            token=create_token(username),
            username=username,
            redirectUrl=Config.POST_AUTH_REDIRECT,
        )

    @app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
    def register(body: Credentials) -> AuthResponse:
        with SessionLocal() as session:
            if session.scalar(select(User).where(User.username == body.username)):
                raise HTTPException(
                    status_code=409, detail={"message": "Username already taken"}
                )
            session.add(
                User(
                    username=body.username,
                    password_hash=hash_password(body.password),
                )
            )
            try:
                session.commit()
            except IntegrityError as exc:
                session.rollback()
                raise HTTPException(
                    status_code=409, detail={"message": "Username already taken"}
                ) from exc
        return _auth_response(body.username)

    @app.post("/api/auth/login", response_model=AuthResponse)
    def login(body: Credentials) -> AuthResponse:
        with SessionLocal() as session:
            user = session.scalar(select(User).where(User.username == body.username))
            if user is None or not check_password(body.password, user.password_hash):
                raise HTTPException(
                    status_code=401, detail={"message": "Wrong login or password"}
                )
        return _auth_response(body.username)

    @app.post("/api/auth/logout", status_code=204)
    def logout() -> Response:
        return Response(status_code=204)

    @app.get("/api/auth/me", response_model=UserProfileResponse)
    def me(username: str = Depends(current_username)) -> UserProfileResponse:
        return UserProfileResponse(username=username)

    # Authenticated self-delete. Tokens are stateless: a JWT issued earlier keeps verifying
    # after deletion, but current_username answers 401 once the row is gone.
    @app.delete("/api/auth/me", status_code=204)
    def delete_account(username: str = Depends(current_username)) -> Response:
        with SessionLocal() as session:
            user = session.scalar(select(User).where(User.username == username))
            session.delete(user)
            session.commit()
        return Response(status_code=204)

    # Registered last so it only catches what the real routes above did not: the reference
    # security chain authenticates every /api/** path, and a 404 would leak the API shape.
    @app.api_route(
        "/api/{unmapped:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        include_in_schema=False,
    )
    def unmapped_api(unmapped: str) -> Response:
        raise HTTPException(status_code=401, detail={"message": "Unauthorized"})

    if init_db:
        apply_schema()
        seed_data()

    return app


app = create_app()
