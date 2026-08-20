# Build context: this module. DS runtime is vendor/ds.
# TypeScript needs compiling, so this is a two-stage build even though the
# output is three plain HTML documents.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY vendor/ds/ /tmp/ui-runtime/
COPY --from=build /app/dist /tmp/ui-dist/
# Overlay first: the design-system css/ and js/header.js the pages link to, then
# the built app merged over it (product css/ lands beside the overlay css/).
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-dist/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-dist
EXPOSE 80
