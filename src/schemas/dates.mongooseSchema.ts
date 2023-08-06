import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { User } from './user.mongooseSchema';

export type VisitDateDocument = HydratedDocument<Date>;

@Schema({ versionKey: false, timestamps: true })
export class VisitDate {
  @Prop({ unique: true })
  visitDate: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  client: User;
  @Prop({ default: false })
  isConfirmed: boolean;
  @Prop({ expires: 60 })
  expireAt: Date;
}

export const VisitDateSchema = SchemaFactory.createForClass(VisitDate);

VisitDateSchema.pre('save', async function (next) {
  this.expireAt = this.visitDate;
  next();
});
