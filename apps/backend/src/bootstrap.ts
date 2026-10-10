import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';
import { messages, t, type MessageKey } from '@saf-shekan/i18n';
import { AppModule } from './app.module.js';

function isValidationKey(key: string): key is MessageKey<'validation'> {
  return Object.prototype.hasOwnProperty.call(messages.validation, key);
}

function validationLines(errors: ValidationError[], parent = ''): string[] {
  const lines: string[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const constraints = error.constraints ? Object.keys(error.constraints) : [];
    if (constraints.length === 0 && !(error.children && error.children.length > 0)) {
      lines.push(t('validation', 'invalid', { field }));
    }
    for (const name of constraints) {
      lines.push(
        isValidationKey(name) ? t('validation', name, { field }) : t('validation', 'invalid', { field })
      );
    }
    if (error.children && error.children.length > 0) {
      lines.push(...validationLines(error.children, field));
    }
  }
  return lines;
}

export async function createNestApp() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // آداپتور وب‌سوکت فوق‌سریع ws
  app.useWebSocketAdapter(new WsAdapter(app));

  // امنیت و هدرهای محافظتی
  app.use(
    helmet({
      contentSecurityPolicy: false, // API-only; Swagger UI و کلاینت‌های جداگانه
      crossOriginEmbedderPolicy: false,
    })
  );

  // تنظیم CORS برای اتصال فرانت‌اند لوکال
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // پایپ اعتبارسنجی سراسری DTOها
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException(validationLines(errors).join(' | ')),
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(t('swagger', 'title'))
    .setDescription(t('swagger', 'description'))
    .setVersion('2.0')
    .addTag('Sniper Engine & System Status', t('swagger', 'tag.sniper'))
    .addTag('Config', t('swagger', 'tag.config'))
    .addTag('TimeSync', t('swagger', 'tag.time'))
    .addTag('Network & Broker', t('swagger', 'tag.network'))
    .addTag('Brokers & cURL', t('swagger', 'tag.brokers'))
    .addTag('Symbols', t('swagger', 'tag.symbols'))
    .addTag('Market Data', t('swagger', 'tag.market'))
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: t('swagger', 'siteTitle'),
  });

  return app;
}
