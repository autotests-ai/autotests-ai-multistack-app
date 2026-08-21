'use strict';

const { Controller, Get, Header, StreamableFile } = require('@nestjs/common');

const { readOpenApiResource } = require('./openapi-resources');

/**
 * Serves the shared contract ({@code _contract/openapi.yaml} copied into
 * {@code resources/}). Swagger UI is mounted separately from this file via
 * {@code @nestjs/swagger} — not DocumentBuilder.
 */
@Controller('api')
class OpenApiController {
  @Get('openapi.yaml')
  @Header('Content-Type', 'application/yaml')
  spec() {
    return new StreamableFile(readOpenApiResource('openapi.yaml'), {
      type: 'application/yaml',
    });
  }
}

module.exports = { OpenApiController };
