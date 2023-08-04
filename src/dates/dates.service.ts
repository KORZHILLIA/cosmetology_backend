import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { VisitDate } from 'src/schemas/dates.mongooseSchema';
import { User } from 'src/schemas/user.mongooseSchema';

@Injectable()
export class DatesService {
  constructor(
    @InjectModel(VisitDate.name) private visitDateModel: Model<VisitDate>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async addNewVisitDates(dates: number[]) {
    const preparedDates = dates.map((date) => ({ visitDate: date }));
    const insertedDates = await this.visitDateModel.create([...preparedDates], {
      new: true,
    });
    return insertedDates;
  }

  async getAllVisitDates() {
    const allVisitDates = await this.visitDateModel
      .find({})
      .populate('client', '_id');
    return allVisitDates;
  }

  async reserveVisitDate(visitDateID: string, userID: Types.ObjectId) {
    const requiredVisitDate = await this.visitDateModel.findByIdAndUpdate(
      visitDateID,
      { client: userID },
    );
    if (!requiredVisitDate) {
      throw new NotFoundException('There is no such visit date');
    }
    const userWithReservedVisitDate = await this.userModel
      .findByIdAndUpdate(
        userID,
        {
          $addToSet: {
            futureVisitDates: visitDateID,
            pastVisitDates: { date: requiredVisitDate.visitDate },
          },
        },
        { new: true },
      )
      .populate('futureVisitDates');
    return userWithReservedVisitDate;
  }

  async refuseVisitDate(visitDateID: string, userID: Types.ObjectId) {
    const visitDateFreeAgain = await this.visitDateModel.findByIdAndUpdate(
      visitDateID,
      { client: null },
    );
    if (!visitDateFreeAgain) {
      throw new NotFoundException('There is no such visit date');
    }
    const userWithoutVisitDate = await this.userModel.findByIdAndUpdate(
      userID,
      {
        $pull: {
          futureVisitDates: visitDateID,
          pastVisitDates: { date: visitDateFreeAgain.visitDate },
        },
      },
      { new: true },
    );
    return userWithoutVisitDate;
  }
}
