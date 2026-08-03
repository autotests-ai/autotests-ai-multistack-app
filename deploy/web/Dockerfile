# Build context: repository root. Serves UI; proxies /api to the backend service.
ARG UI_MODULE
ARG UI_RUNTIME

FROM nginx:1.27-alpine
ARG UI_MODULE
ARG UI_RUNTIME

COPY deploy/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME} /tmp/ui-runtime
COPY ${UI_MODULE} /tmp/ui

RUN test -n "$UI_MODULE" && test -n "$UI_RUNTIME" \
  && rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md

EXPOSE 80
