import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from "@nestjs/jwt";

import { VisitDate, VisitDateSchema } from 'src/schemas/dates.mongooseSchema';
import { DatesController } from './dates.controller';
import { DatesService } from './dates.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitDate.name, schema: VisitDateSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [DatesController],
  providers: [DatesService],
  exports: [
    MongooseModule.forFeature([
      { name: VisitDate.name, schema: VisitDateSchema },
    ]),
  ],
})
export class DatesModule {}
