import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './users/users.module';
import { DatesModule } from './dates/dates.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, cache: true}), MongooseModule.forRoot(process.env.DB_HOST), UsersModule, DatesModule],
})
export class AppModule { };
