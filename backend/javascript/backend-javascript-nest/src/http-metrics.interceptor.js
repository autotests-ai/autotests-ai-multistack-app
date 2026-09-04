'use strict';

const { Injectable } = require('@nestjs/common');

const { observeHttp } = require('./metrics');

@Injectable()
class HttpMetricsInterceptor {
  intercept(context, next) {
    const http = context.switchToHttp();
    observeHttp(http.getRequest(), http.getResponse());
    return next.handle();
  }
}

module.exports = { HttpMetricsInterceptor };
