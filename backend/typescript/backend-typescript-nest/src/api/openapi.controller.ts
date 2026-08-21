import { Controller, Get, Header, StreamableFile } from '@nestjs/common';

import { readOpenApiResource } from '../openapi-resources';

/**
 * Serves the shared contract (`_contract/openapi.yaml` copied into `resources/`).
 * Swagger UI is mounted separately via `@nestjs/swagger` — not DocumentBuilder.
 */
@Controller()
export class OpenApiController {
  @Get('openapi.yaml')
  @Header('Content-Type', 'application/yaml')
  spec(): StreamableFile {
    return new StreamableFile(readOpenApiResource('openapi.yaml'), {
      type: 'application/yaml',
    });
  }
}
