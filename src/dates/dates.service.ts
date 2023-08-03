import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { visitDate } from 'src/schemas/dates.mongooseSchema';

@Injectable()
export class DatesService {
  constructor(
    @InjectModel(visitDate.name) private visitDateModel: Model<Date>,
  ) {}

  async addNewVisitDates(dates: number[]) {
    const preparedDates = dates.map((date) => ({ visitDate: date }));
    const insertedDates = await this.visitDateModel.create([...preparedDates], {
      new: true,
    });
    return insertedDates;
  }
}
