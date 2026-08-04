# Build context: repository root.
# Multi-stage: Vite SPA → nginx under UI_MOUNT; overlays UI_RUNTIME (header.js).
ARG UI_MODULE=frontend/typescript/frontend-typescript-react
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app
ARG UI_MOUNT=frontend-typescript-react
ARG REACT_UI=frontend/_shared/frontend-react-ui

FROM node:26-alpine AS ui-build
ARG UI_MODULE
ARG REACT_UI
WORKDIR /build

# Preserve relative imports: product → _shared/{frontend-react-ui,frontend-javascript-app}
COPY ${UI_MODULE}/ ${UI_MODULE}/
COPY ${REACT_UI}/ ${REACT_UI}/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/

WORKDIR /build/${UI_MODULE}
RUN npm ci && npm run build

FROM nginx:1.27-alpine
ARG UI_MODULE
ARG UI_RUNTIME
ARG UI_MOUNT

COPY deploy/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME} /tmp/ui-runtime
COPY --from=ui-build /build/${UI_MODULE}/dist /tmp/ui-dist

RUN test -n "$UI_MODULE" && test -n "$UI_RUNTIME" && test -n "$UI_MOUNT" \
  && rm -rf /usr/share/nginx/html/* \
  && mkdir -p "/usr/share/nginx/html/${UI_MOUNT}" \
  && cp -a /tmp/ui-runtime/. "/usr/share/nginx/html/${UI_MOUNT}/" \
  && cp -a /tmp/ui-dist/. "/usr/share/nginx/html/${UI_MOUNT}/" \
  && rm -f "/usr/share/nginx/html/${UI_MOUNT}/README.md"

EXPOSE 80
