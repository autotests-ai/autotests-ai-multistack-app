# Build context: repository root.
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM node:26-alpine AS build
WORKDIR /build
COPY frontend/typescript/frontend-typescript-angular/ frontend/typescript/frontend-typescript-angular/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/
WORKDIR /build/frontend/typescript/frontend-typescript-angular
RUN npm ci && npm run build

FROM nginx:1.27-alpine
ARG UI_RUNTIME
COPY frontend/typescript/frontend-typescript-angular/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME}/ /tmp/ui-runtime/
COPY --from=build /build/frontend/typescript/frontend-typescript-angular/dist /tmp/ui-dist/
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-dist/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-dist
EXPOSE 80
