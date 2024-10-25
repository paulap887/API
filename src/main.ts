import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bufferLogs: true,
  });
  
  app.useLogger(app.get(Logger));

  // Security middlewares
  app.use(helmet());

  // CORS configuration
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.use(cors({
    origin: frontendUrl,
    credentials: true,
  }));

  // Validation pipe for DTO validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('API for authentication and user management')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addBearerAuth() // Ensure this line is present
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT', 3000);
  
  // Additional headers for CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', frontendUrl);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });

  // Handle OPTIONS requests
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  await app.listen(port);
  app.get(Logger).log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();
