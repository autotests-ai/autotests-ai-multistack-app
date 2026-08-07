import {
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { INVALID_JSON_BODY_MESSAGE } from './json-body.decorator';

function messageOf(exception: unknown): string {
  // Nest maps a body-parser SyntaxError to a bare BadRequestException carrying the parser's own
  // wording; every 400 this module raises itself is an ApiException, so this branch is reached
  // only by a body Express could not read.
  if (exception instanceof BadRequestException) {
    return INVALID_JSON_BODY_MESSAGE;
  }
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      return Array.isArray(message) ? String(message[0]) : String(message);
    }
    return typeof body === 'string' ? body : exception.message;
  }
  return 'Internal server error';
}

function isApiPath(path: string): boolean {
  return path === '/api' || path.startsWith('/api/');
}

/** Normalises anything thrown — including Nest's own 404s — to the `{message}` shape. */
@Catch()
export class MessageExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Unmapped paths under `/api` are 401, not 404: the reference authenticates `/api/**` in its
    // security chain, before routing can report a missing handler.
    if (status === HttpStatus.NOT_FOUND && isApiPath(request.path)) {
      response.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
      return;
    }

    response.status(status).json({ message: messageOf(exception) });
  }
}
