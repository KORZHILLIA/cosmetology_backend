import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { MongooseExceptionFilter } from './exceptions/mongoose-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalFilters(new MongooseExceptionFilter());
  app.use(helmet());
  app.use(cookieParser());
  await app.listen(process.env.PORT);
}
bootstrap();
