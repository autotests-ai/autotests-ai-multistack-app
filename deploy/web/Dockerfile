# Build context: repository root.
# Multi-stage: active UIs (matrix.yaml) → one shared static nginx image.
# No /api proxy — host nginx routes /{backend}/api → backend, /{backend}/{frontend} → this image.
ARG REACT_UI=frontend/_shared/frontend-react-ui
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM node:26-alpine AS ui-ts-react
ARG REACT_UI
WORKDIR /build
COPY frontend/typescript/frontend-typescript-react/ frontend/typescript/frontend-typescript-react/
COPY ${REACT_UI}/ ${REACT_UI}/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/
WORKDIR /build/frontend/typescript/frontend-typescript-react
RUN npm ci && npm run build

FROM node:26-alpine AS ui-ts-vue
WORKDIR /build
COPY frontend/typescript/frontend-typescript-vue/ frontend/typescript/frontend-typescript-vue/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/
WORKDIR /build/frontend/typescript/frontend-typescript-vue
RUN npm ci && npm run build

FROM nginx:1.27-alpine
ARG UI_RUNTIME

COPY deploy/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME} /tmp/ui-runtime
COPY --from=ui-ts-react /build/frontend/typescript/frontend-typescript-react/dist /tmp/ui-ts-react
COPY --from=ui-ts-vue /build/frontend/typescript/frontend-typescript-vue/dist /tmp/ui-ts-vue
COPY frontend/javascript/frontend-javascript-vanilla/ /tmp/ui-js-vanilla/

RUN rm -rf /usr/share/nginx/html/* \
  && mkdir -p \
    /usr/share/nginx/html/frontend-typescript-react \
    /usr/share/nginx/html/frontend-typescript-vue \
    /usr/share/nginx/html/frontend-javascript-vanilla \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/frontend-typescript-react/ \
  && cp -a /tmp/ui-ts-react/. /usr/share/nginx/html/frontend-typescript-react/ \
  && rm -f /usr/share/nginx/html/frontend-typescript-react/README.md \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/frontend-typescript-vue/ \
  && cp -a /tmp/ui-ts-vue/. /usr/share/nginx/html/frontend-typescript-vue/ \
  && rm -f /usr/share/nginx/html/frontend-typescript-vue/README.md \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/frontend-javascript-vanilla/ \
  && cp -a /tmp/ui-js-vanilla/. /usr/share/nginx/html/frontend-javascript-vanilla/ \
  && rm -f /usr/share/nginx/html/frontend-javascript-vanilla/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-ts-react /tmp/ui-ts-vue /tmp/ui-js-vanilla

EXPOSE 80
