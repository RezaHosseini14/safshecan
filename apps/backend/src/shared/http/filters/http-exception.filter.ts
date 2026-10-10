import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { t } from '@saf-shekan/i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = t('errors', 'internal');
    let errorDetails: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as { message?: string | string[]; error?: unknown };
        message = (resObj.message as string) || message;
        errorDetails = resObj.error || undefined;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(' | ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Market-data must never surface 5xx / hard client failures — always soft 200.
    if (path.includes('/api/market')) {
      if (path.includes('/quote')) {
        const symbol =
          typeof request.query?.symbol === 'string' ? request.query.symbol : '—';
        response.status(200).json({
          ok: false,
          degraded: true,
          warning: message,
          symbol,
          name: symbol,
          isin: '',
          insCode: '',
          lastPrice: 0,
          closingPrice: 0,
          yesterdayPrice: 0,
          change: 0,
          changePercent: 0,
          openPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          volume: 0,
          value: 0,
          tradesCount: 0,
          stateTitle: t('common', 'noData'),
          orderBook: [],
          clientFlow: null,
          fetchedAt: new Date().toISOString(),
          source: 'EMPTY',
        });
        return;
      }

      response.status(200).json({
        ok: false,
        success: false,
        statusCode: 200,
        message,
        watchlist: [],
        timestamp: new Date().toISOString(),
        path,
      });
      return;
    }

    // Symbols list / refresh — never 500; empty list or soft refresh payload.
    if (path.includes('/api/symbols')) {
      if (path.includes('/refresh')) {
        response.status(200).json({
          success: false,
          totalSymbols: 0,
          ipoCount: 0,
          newIpos: [],
          message: message || t('errors', 'syncSoft'),
        });
        return;
      }
      if (path.includes('/status')) {
        response.status(200).json({
          totalSymbols: 0,
          ipoCount: 0,
          lastSyncTime: null,
          isSyncing: false,
          lastError: message,
        });
        return;
      }
      response.status(200).json([]);
      return;
    }

    // Never leak opaque 500 for unexpected errors elsewhere — use 503 with message.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof HttpException)) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      if (!message || message === t('errors', 'internal')) {
        message = t('errors', 'unavailable');
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
