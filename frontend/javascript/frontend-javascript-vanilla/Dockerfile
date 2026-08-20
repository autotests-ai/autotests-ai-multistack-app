# Build context: this module. DS runtime is vendor/ds. Static — no Node build.
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
  && rm -rf /usr/share/nginx/html/vendor/ds \
  && rm -rf /tmp/ui-runtime /tmp/ui-src
EXPOSE 80
