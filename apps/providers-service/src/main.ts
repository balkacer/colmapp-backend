import { NestFactory } from '@nestjs/core';
import { ProvidersServiceModule } from './providers-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProvidersServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
