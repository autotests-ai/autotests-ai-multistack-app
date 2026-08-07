'use strict';

const { Catch, HttpException, HttpStatus, Logger } = require('@nestjs/common');

/** Normalises every failure to the contract's `{"message": "..."}` envelope. */
@Catch()
class ApiExceptionFilter {
  constructor() {
    this.logger = new Logger('ApiExceptionFilter');
  }

  catch(exception, host) {
    const http = host.switchToHttp();
    const response = http.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // Nest routes before it can authenticate, so its own 404 for an unmapped
      // path — or a method no route allows — would expose an /api/** surface
      // that the reference answers with 401.
      if (status === HttpStatus.NOT_FOUND && isApiPath(http.getRequest().path)) {
        response
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'Unauthorized' });
        return;
      }
      response.status(status).json({
        message: messageOf(exception.getResponse()),
      });
      return;
    }

    this.logger.error(exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error' });
  }
}

/** True for the `/api/**` surface the reference guards, `/api` itself included. */
function isApiPath(path) {
  return (
    typeof path === 'string' && (path === '/api' || path.startsWith('/api/'))
  );
}

function messageOf(payload) {
  if (typeof payload === 'string') {
    return payload;
  }
  if (payload && typeof payload.message === 'string') {
    return payload.message;
  }
  if (payload && Array.isArray(payload.message)) {
    return payload.message[0];
  }
  return 'Error';
}

module.exports = { ApiExceptionFilter, messageOf, isApiPath };
