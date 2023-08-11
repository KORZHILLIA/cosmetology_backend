import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { MongooseExceptionFilter } from './exceptions/mongoose-exception.filter';

const corsOptions = {
  credentials: true,
  origin: 'https://cosmetology-frontend.vercel.app',
  exposedHeaders: ['set-cookie'],
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalFilters(new MongooseExceptionFilter());
  app.use(cookieParser());
  app.enableCors(corsOptions);
  await app.listen(process.env.PORT);
}
bootstrap();
