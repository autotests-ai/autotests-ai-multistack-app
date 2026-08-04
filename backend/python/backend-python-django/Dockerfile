FROM python:3.12-alpine AS build
RUN apk add --no-cache build-base libffi-dev
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-alpine
RUN apk add --no-cache wget libffi \
    && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /install /usr/local
COPY manage.py entrypoint.sh ./
COPY config ./config
COPY api ./api
RUN chmod +x entrypoint.sh && chown -R app:app /app
USER app
ENV SERVER_PORT=8080
ENV DJANGO_SETTINGS_MODULE=config.settings
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${SERVER_PORT}/api/health" >/dev/null || exit 1
CMD ["./entrypoint.sh"]
