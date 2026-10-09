import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

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
    })
  );

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
    .addTag('Market Data', 'قیمت لحظه‌ای، حجم و صف خرید/فروش از TSETMC')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'صف‌شکن | مستندات API',
  });

  return app;
}
