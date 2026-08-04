# Health-only stub until Flask OpenAPI port lands.
FROM python:3.12-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY app.py .
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1
CMD ["python", "app.py"]
