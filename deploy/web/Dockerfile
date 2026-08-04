# Build context: repository root. Serves UI under UI_MOUNT; proxies /api to backend.
ARG UI_MODULE
ARG UI_RUNTIME
ARG UI_MOUNT=frontend-typescript-react

FROM nginx:1.27-alpine
ARG UI_MODULE
ARG UI_RUNTIME
ARG UI_MOUNT

COPY deploy/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME} /tmp/ui-runtime
COPY ${UI_MODULE} /tmp/ui

RUN test -n "$UI_MODULE" && test -n "$UI_RUNTIME" && test -n "$UI_MOUNT" \
  && rm -rf /usr/share/nginx/html/* \
  && mkdir -p "/usr/share/nginx/html/${UI_MOUNT}" \
  && cp -a /tmp/ui-runtime/. "/usr/share/nginx/html/${UI_MOUNT}/" \
  && cp -a /tmp/ui/. "/usr/share/nginx/html/${UI_MOUNT}/" \
  && rm -f "/usr/share/nginx/html/${UI_MOUNT}/README.md"

EXPOSE 80
