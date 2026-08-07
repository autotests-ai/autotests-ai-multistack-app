import {
  createParamDecorator,
  HttpStatus,
  type ExecutionContext,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiException } from './api-exception';

export const INVALID_JSON_BODY_MESSAGE = 'Request body is not valid JSON';

/**
 * Body of an endpoint that accepts nothing but a JSON object. `rawBody` — enabled through
 * `APP_OPTIONS` — is what tells an empty request apart from a literal `{}`: body-parser
 * reports both as `{}`.
 */
export const JsonBody = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Record<string, unknown> => {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const body: unknown = request.body;

    if (
      request.rawBody === undefined ||
      request.rawBody.length === 0 ||
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_JSON_BODY_MESSAGE);
    }
    return body as Record<string, unknown>;
  },
);
