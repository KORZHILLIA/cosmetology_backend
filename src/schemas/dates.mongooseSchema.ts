import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DateDocument = HydratedDocument<Date>;

@Schema({ versionKey: false, timestamps: true })
export class Date {
    @Prop()
    visitDate: String;
}

export const DateSchema = SchemaFactory.createForClass(Date);