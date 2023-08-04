import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { VisitDate } from './dates.mongooseSchema';

import { PastVisitDate } from 'src/interfaces/dates.interface';

import Roles from 'src/roles/roles.enum';
export type UserDocument = HydratedDocument<User>;

@Schema({ versionKey: false, timestamps: true })
export class User {
  @Prop({ required: true, enum: Roles, default: Roles.User })
  role: string;
  @Prop({ required: [true, 'Name is required'] })
  name: string;
  @Prop({ required: [true, 'Email is required'], unique: true })
  email: string;
  @Prop({ required: [true, 'Password is required'] })
  password: string;
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'VisitDate' }],
    default: [],
  })
  futureVisitDates: VisitDate[];
  @Prop({ default: [] })
  pastVisitDates: PastVisitDate[];
  @Prop({ default: '' })
  verificationToken: string;
  @Prop({ default: false })
  isVerified: boolean;
  @Prop({ default: '' })
  accessToken: string;
  @Prop({ default: '' })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
