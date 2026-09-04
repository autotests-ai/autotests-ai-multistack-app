FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package.json schema.sql ./
COPY src ./src
COPY resources ./resources
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
ENV SERVER_PORT=8080
ENV MANAGEMENT_PORT=8081
EXPOSE 8080
EXPOSE 8081
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${SERVER_PORT}/api/health" >/dev/null || exit 1
CMD ["node", "src/server.js"]
