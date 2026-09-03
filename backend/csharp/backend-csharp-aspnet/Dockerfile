FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY src/BackendCSharpAspnet/BackendCSharpAspnet.csproj src/BackendCSharpAspnet/
COPY schema.sql schema.sql
RUN dotnet restore src/BackendCSharpAspnet/BackendCSharpAspnet.csproj
COPY src/ src/
RUN dotnet publish src/BackendCSharpAspnet/BackendCSharpAspnet.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /out .
USER app
ENV SERVER_PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${SERVER_PORT}/api/health" >/dev/null || exit 1
ENTRYPOINT ["dotnet", "BackendCSharpAspnet.dll"]
