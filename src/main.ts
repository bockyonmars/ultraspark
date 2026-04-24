import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';
  const port = configService.get<number>('app.port', 4000);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(isProduction));

  const allowedOrigins = [
    'https://ultrasparkcleaning.co.uk',
    'https://www.ultrasparkcleaning.co.uk',
    configService.get<string>('app.adminUrl') ?? 'https://admin.ultrasparkcleaning.co.uk',
    'https://ultraspark-admin.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UltraSpark Cleaning API')
    .setDescription('Backend API for UltraSpark Cleaning website and admin tools')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}

void bootstrap();
