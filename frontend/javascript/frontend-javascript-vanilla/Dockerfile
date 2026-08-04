# Build context: repository root. Static module — no Node build.
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM nginx:1.27-alpine
ARG UI_RUNTIME
COPY frontend/javascript/frontend-javascript-vanilla/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME}/ /tmp/ui-runtime/
COPY frontend/javascript/frontend-javascript-vanilla/ /tmp/ui-src/
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-src/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /usr/share/nginx/html/Dockerfile \
  && rm -rf /usr/share/nginx/html/nginx.conf \
  && rm -rf /usr/share/nginx/html/.github \
  && rm -rf /tmp/ui-runtime /tmp/ui-src
EXPOSE 80
