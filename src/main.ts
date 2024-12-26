import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Listen on port 4000 (or any you prefer)
  await app.listen(4000);
  console.log('User microservice is running on http://localhost:4000');
}
bootstrap();
