import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import checkIsDateNotPast from 'src/helpers/checkIsDateNotPast';

import { VisitDate } from 'src/schemas/dates.mongooseSchema';
import { User } from 'src/schemas/user.mongooseSchema';

@Injectable()
export class DatesService {
  constructor(
    @InjectModel(VisitDate.name) private visitDateModel: Model<VisitDate>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async addNewVisitDates(dates: number[]) {
    this.checkIsReqDateNotPast(dates);
    const preparedDates = dates.map((date) => ({ visitDate: date }));
    const insertedDates = await this.visitDateModel.create([...preparedDates], {
      new: true,
    });
    return insertedDates;
  }

  async alterVisitDateByAdmin(visitDateID: string, newDate: number) {
    this.checkIsReqDateNotPast([newDate]);
    const updatedAvailableVisitDateByAdmin = await this.updateVisitDate(
      visitDateID,
      { visitDate: newDate },
    );
    return updatedAvailableVisitDateByAdmin;
  }

  async deleteVisitDate(visitDateID: string): Promise<Types.ObjectId> {
    const requiredVisitDate = await this.visitDateModel.findById(visitDateID);
    if (!requiredVisitDate) {
      throw new NotFoundException('There is no such visit date');
    }
    if (requiredVisitDate.client) {
      throw new ForbiddenException('This date has the client');
    }
    const deletedDate = await this.visitDateModel.findByIdAndDelete(
      visitDateID,
    );
    return deletedDate._id;
  }

  async getAllVisitDates() {
    const allVisitDates = await this.visitDateModel
      .find({})
      .populate('client', 'name');
    return allVisitDates;
  }

  async reserveVisitDate(visitDateID: string, userID: Types.ObjectId) {
    const requiredVisitDate = await this.updateVisitDate(visitDateID, {
      client: userID,
    });
    const reservedVisitDateID = requiredVisitDate._id;
    const userWithReservedVisitDate = await this.userModel
      .findByIdAndUpdate(
        userID,
        {
          $addToSet: {
            futureVisitDates: reservedVisitDateID,
            pastVisitDates: {
              date: requiredVisitDate.visitDate,
              postConfirmed: false,
            },
          },
        },
        { new: true },
      )
      .populate('futureVisitDates');
    if (!userWithReservedVisitDate) {
      throw new NotFoundException('User not found');
    }
    const {
      accessToken,
      _id: userId,
      futureVisitDates,
      pastVisitDates,
    } = userWithReservedVisitDate;
    return {
      userId,
      accessToken,
      reservedVisitDateID,
      futureVisitDates,
      pastVisitDates,
    };
  }

  async refuseVisitDate(visitDateID: string, userID: Types.ObjectId) {
    const visitDateFreeAgain = await this.updateVisitDate(visitDateID, {
      client: null,
      isConfirmed: false,
    });
    const userWithoutVisitDate = await this.userModel
      .findByIdAndUpdate(
        userID,
        {
          $pull: {
            futureVisitDates: visitDateID,
            pastVisitDates: { date: visitDateFreeAgain.visitDate },
          },
        },
        { new: true },
      )
      .populate('futureVisitDates');
    if (!userWithoutVisitDate) {
      throw new NotFoundException('User not found');
    }
    return userWithoutVisitDate;
  }

  async confirmVisitDate(visitDateID: string) {
    const confirmedVisitDate = await this.updateVisitDate(visitDateID, {
      isConfirmed: true,
    });
    return confirmedVisitDate;
  }

  async updateVisitDate(visitDateID: string, updateCore: Record<string, any>) {
    const updatedVisitDate = await this.visitDateModel.findByIdAndUpdate(
      visitDateID,
      updateCore,
      { new: true },
    );
    if (!updatedVisitDate) {
      throw new NotFoundException('There is no such visit date');
    }
    return updatedVisitDate;
  }

  checkIsReqDateNotPast(dates: number[]): void {
    if (checkIsDateNotPast(dates)) {
      throw new ForbiddenException('Please use future dates only');
    }
  }
}
