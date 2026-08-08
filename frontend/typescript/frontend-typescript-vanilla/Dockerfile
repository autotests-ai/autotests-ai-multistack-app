# Build context: repository root. TypeScript needs compiling, so this is a
# two-stage build even though the output is three plain HTML documents.
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM node:26-alpine AS build
WORKDIR /build
COPY frontend/typescript/frontend-typescript-vanilla/ frontend/typescript/frontend-typescript-vanilla/
WORKDIR /build/frontend/typescript/frontend-typescript-vanilla
RUN npm ci && npm run build

FROM nginx:1.27-alpine
ARG UI_RUNTIME
COPY frontend/typescript/frontend-typescript-vanilla/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME}/ /tmp/ui-runtime/
COPY --from=build /build/frontend/typescript/frontend-typescript-vanilla/dist /tmp/ui-dist/
# Overlay first: the design-system css/ and js/header.js the pages link to, then
# the built app merged over it (product css/ lands beside the overlay css/).
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-dist/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-dist
EXPOSE 80
