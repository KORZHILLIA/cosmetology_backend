import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, cache: true}), MongooseModule.forRoot(process.env.DB_HOST), UsersModule],
})
export class AppModule { };
