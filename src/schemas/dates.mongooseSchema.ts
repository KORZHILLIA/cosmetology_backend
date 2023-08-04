import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { User } from './user.mongooseSchema';

export type VisitDateDocument = HydratedDocument<Date>;

@Schema({ versionKey: false, timestamps: true })
export class VisitDate {
  @Prop()
  visitDate: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  client: User;
  @Prop({ default: false })
  isConfirmed: boolean;
}

export const VisitDateSchema = SchemaFactory.createForClass(VisitDate);

VisitDateSchema.pre('save', async function (next) {
  console.log(
    new Date(new Date('2023-08-04 22:32:00').toUTCString()).getTime(),
  );
  console.log(
    new Date(new Date('2023-08-04 22:37:00').toUTCString()).getTime(),
  );
  // console.log(new Date(new Date('2023-08-04 18:30:00').toUTCString()).getTime());
  VisitDateSchema.path('visitDate').options.expires =
    this.visitDate.getTime() + 60000;
  next();
});
