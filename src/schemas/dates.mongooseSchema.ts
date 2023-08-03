import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type visitDateDocument = HydratedDocument<Date>;

@Schema({ versionKey: false, timestamps: true })
export class visitDate {
  @Prop()
  visitDate: Date;
}

export const visitDateSchema = SchemaFactory.createForClass(visitDate);

visitDateSchema.pre('save', async function (next) {
  //   console.log(new Date(new Date('2023-08-03 16:20:00').toUTCString()).getTime());
  //   console.log(new Date(new Date('2023-08-03 16:25:00').toUTCString()).getTime());
  // console.log(new Date(new Date('2023-08-03 16:30:00').toUTCString()).getTime());
  visitDateSchema.path('visitDate').options.expires =
    this.visitDate.getTime() + 60000;
  next();
});
