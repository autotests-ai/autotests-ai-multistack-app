'use strict';

const { Catch, HttpException, HttpStatus, Logger } = require('@nestjs/common');

/** Normalises every failure to the contract's `{"message": "..."}` envelope. */
@Catch()
class ApiExceptionFilter {
  constructor() {
    this.logger = new Logger('ApiExceptionFilter');
  }

  catch(exception, host) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
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

module.exports = { ApiExceptionFilter, messageOf };
