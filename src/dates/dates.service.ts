import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from "mongoose";

import { Date } from "src/schemas/dates.mongooseSchema";

@Injectable()
export class DatesService {
    constructor(@InjectModel(Date.name) private dateModel: Model<Date>) { }

    async addNewVisitDates(dates: string[]) {
        const preparedDates = dates.map(date => ({visitDate: date}));
        const insertedDates = await this.dateModel.create(preparedDates);
        return insertedDates;
    }
}
