import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

export async function createNestApp() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // آداپتور وب‌سوکت فوق‌سریع ws
  app.useWebSocketAdapter(new WsAdapter(app));

  // امنیت و هدرهای محافظتی
  app.use(
    helmet({
      contentSecurityPolicy: false, // اجازه به دارایی‌های استاتیک فرانت و فونت‌ها
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
    })
  );

  // محافظت از ترافیک و Rate Limiting سراسری
  const reflector = app.get(Reflector);
  const throttlerOptions = app.get('THROTTLER:MODULE_OPTIONS');
  const throttlerStorage = app.get(ThrottlerStorage);
  const throttlerGuard = new ThrottlerGuard(throttlerOptions, throttlerStorage, reflector);
  await throttlerGuard.onModuleInit();
  app.useGlobalGuards(throttlerGuard);

  // مدیریت خطاهای سراسری
  app.useGlobalFilters(new AllExceptionsFilter());

  // لاگر سراسری درخواست‌ها
  app.useGlobalInterceptors(new LoggingInterceptor());

  // مستندات تعاملی Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('⚡ صف‌شکن (SafShekan) - High-Precision HFT Sniping API')
    .setDescription('مستندات تعاملی و Enterprise ربات سرخطی‌زن بورس تهران، ساعت اتمی و موتور شلیک رگباری')
    .setVersion('2.0')
    .addTag('Sniper Engine & System Status', 'وضعیت موتور، مسلح‌سازی و نتایج شلیک')
    .addTag('Config', 'تنظیمات و پیکربندی ربات')
    .addTag('TimeSync', 'کالیبراسیون ساعت اتمی با NTP و HTTP')
    .addTag('Network & Broker', 'تست پینگ و پیش‌گرمایش SSL')
    .addTag('Brokers & cURL', 'تحلیلگر پیشرفته cURL و قالب کارگزاری‌ها')
    .addTag('Symbols', 'جستجوی نمادهای بورس و فرابورس')
    .addTag('Simulation & Backtesting', 'بک‌تست تاریخی و شبیه‌ساز بازگشایی')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'صف‌شکن | مستندات API',
  });

  return app;
}
