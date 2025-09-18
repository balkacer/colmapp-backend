import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  logger.log('Helmet middleware enabled');

  // Cookie parser
  app.use(cookieParser());
  logger.log('Cookie parser middleware enabled');

  // Compression middleware
  app.use(compression());
  logger.log('Compression middleware enabled');

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  logger.log(`Global prefix set to '${globalPrefix}'`);

  // Port
  const port = process.env.PORT || 3000;
  logger.log(`Starting server on port ${port}`);

  await app.listen(port);
  logger.log(`Server is listening on http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
