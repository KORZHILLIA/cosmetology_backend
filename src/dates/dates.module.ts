import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from "@nestjs/jwt";

import { visitDate, visitDateSchema } from 'src/schemas/dates.mongooseSchema';
import { DatesController } from './dates.controller';
import { DatesService } from './dates.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: visitDate.name, schema: visitDateSchema },
    ]),
    UsersModule,
  ],
  controllers: [DatesController],
  providers: [DatesService],
})
export class DatesModule {}
