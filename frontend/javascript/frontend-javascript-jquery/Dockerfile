# Build context: this module. DS runtime is vendor/ds. Static — no Node build.
# jQuery is vendored in vendor/jquery.min.js; npm here is dev tooling only (Vitest).
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY vendor/ds/ /tmp/ui-runtime/
COPY . /tmp/ui-src/
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-src/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /usr/share/nginx/html/Dockerfile \
  && rm -rf /usr/share/nginx/html/nginx.conf \
  && rm -rf /usr/share/nginx/html/.github \
  && rm -f /usr/share/nginx/html/.gitignore \
  && rm -f /usr/share/nginx/html/.nvmrc \
  && rm -f /usr/share/nginx/html/package.json \
  && rm -f /usr/share/nginx/html/package-lock.json \
  && rm -f /usr/share/nginx/html/vitest.config.js \
  && rm -rf /usr/share/nginx/html/node_modules \
  && rm -rf /usr/share/nginx/html/src \
  && rm -rf /usr/share/nginx/html/scripts \
  && rm -rf /usr/share/nginx/html/coverage \
  && rm -rf /usr/share/nginx/html/vendor/ds \
  && rm -rf /tmp/ui-runtime /tmp/ui-src
EXPOSE 80
