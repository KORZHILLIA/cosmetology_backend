import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { emailRegexp } from 'src/constants/regexp';

export type UserDocument = HydratedDocument<User>;

@Schema({ versionKey: false, timestamps: true })
export class User {
    @Prop({required: [true, 'Name is required'], minlength: 4, maxlength: 20})
    name: string;
    @Prop({ required: [true, 'Email is required'], match: emailRegexp, unique: true})
    email: string;
    @Prop({required: [true, 'Password is required']})
    password: string;
    @Prop({default: ''})
    verificationToken: string;
    @Prop({default: false})
    isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);