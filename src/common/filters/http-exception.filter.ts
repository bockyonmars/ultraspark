import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    response.status(status).json({
      success: false,
      message:
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as { message?: string }).message ?? 'Request failed',
      error:
        this.isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR
          ? undefined
          : errorResponse,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
