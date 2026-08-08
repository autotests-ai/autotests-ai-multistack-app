# Build context: repository root.
ARG REACT_UI=frontend/_shared/frontend-react-ui
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM node:26-alpine AS build
ARG REACT_UI
WORKDIR /build
COPY frontend/javascript/frontend-javascript-react/ frontend/javascript/frontend-javascript-react/
COPY ${REACT_UI}/ ${REACT_UI}/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/
WORKDIR /build/frontend/javascript/frontend-javascript-react
RUN npm ci && npm run build

FROM nginx:1.27-alpine
ARG UI_RUNTIME
COPY frontend/javascript/frontend-javascript-react/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME}/ /tmp/ui-runtime/
COPY --from=build /build/frontend/javascript/frontend-javascript-react/dist /tmp/ui-dist/
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-dist/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-dist
EXPOSE 80
