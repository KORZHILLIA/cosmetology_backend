import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
