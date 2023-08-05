import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import * as mongooseUniqueValidator from 'mongoose-unique-validator';

import { User, UserSchema } from 'src/schemas/user.mongooseSchema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatesModule } from 'src/dates/dates.module';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.plugin(mongooseUniqueValidator);
          return schema;
        },
      },
    ]),
    JwtModule.register({ global: true }),
    // DatesModule,
    forwardRef(() => DatesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [
    UsersService,
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.plugin(mongooseUniqueValidator);
          return schema;
        },
      },
    ]),
  ],
})
export class UsersModule {}
