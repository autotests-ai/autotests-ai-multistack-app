# Build context: repository root.
ARG REACT_UI=frontend/_shared/frontend-react-ui
ARG UI_RUNTIME=frontend/_shared/frontend-javascript-app

FROM node:26-alpine AS build
ARG REACT_UI
WORKDIR /build
COPY frontend/typescript/frontend-typescript-react/package.json \
     frontend/typescript/frontend-typescript-react/package-lock.json \
     frontend/typescript/frontend-typescript-react/
WORKDIR /build/frontend/typescript/frontend-typescript-react
RUN npm ci
WORKDIR /build
COPY frontend/typescript/frontend-typescript-react/ frontend/typescript/frontend-typescript-react/
COPY ${REACT_UI}/ ${REACT_UI}/
COPY frontend/_shared/frontend-javascript-app/css/ frontend/_shared/frontend-javascript-app/css/
COPY frontend/_shared/poll-toggle.ts frontend/_shared/stack-matrix.ts frontend/_shared/
WORKDIR /build/frontend/typescript/frontend-typescript-react
RUN npm run build

FROM nginx:1.27-alpine
ARG UI_RUNTIME
COPY frontend/typescript/frontend-typescript-react/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${UI_RUNTIME}/ /tmp/ui-runtime/
COPY --from=build /build/frontend/typescript/frontend-typescript-react/dist /tmp/ui-dist/
RUN rm -rf /usr/share/nginx/html/* \
  && cp -a /tmp/ui-runtime/. /usr/share/nginx/html/ \
  && cp -a /tmp/ui-dist/. /usr/share/nginx/html/ \
  && rm -f /usr/share/nginx/html/README.md \
  && rm -rf /tmp/ui-runtime /tmp/ui-dist
EXPOSE 80
