import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Request,
  Response,
  UsePipes,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { Response as Res, Request as Req } from 'express';

import { DatesService } from './dates.service';
import { UsersService } from 'src/users/users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';
import { UsersGuard } from 'src/users/users.guard';
import { Role } from 'src/roles/roles.decorator';
import { RolesGuard } from 'src/roles/roles.guard';

import Roles from 'src/roles/roles.enum';
import {
  AddNewVisitDateBody,
  AlterVisitDateByAdminBody,
} from 'src/interfaces/dates.interface';

@UseGuards(RolesGuard, UsersGuard)
@Controller('dates')
export class DatesController {
  constructor(
    private datesService: DatesService,
    private userService: UsersService,
  ) {}

  @Post('new')
  @Role(Roles.Admin)
  async addNewVisitDate(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Body() body: AddNewVisitDateBody,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    const newVisitDates = await this.datesService.addNewVisitDates(body.dates);
    return { accessToken: userWithUpdatedTokens.accessToken, newVisitDates };
  }

  @Put('alter/:visitDateID')
  @Role(Roles.Admin)
  async alterAvailableVisitDateByAdmin(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Param('visitDateID') visitDateID: string,
    @Body() body: AlterVisitDateByAdminBody,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    const alteredDate = await this.datesService.alterVisitDateByAdmin(
      visitDateID,
      body.alteredDate,
    );
    const { accessToken } = userWithUpdatedTokens;
    return { accessToken, alteredDate };
  }

  @Get('all')
  async getAllVisitDates(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    const allAvailableVisitDates = await this.datesService.getAllVisitDates();
    return {
      accessToken: userWithUpdatedTokens.accessToken,
      allAvailableVisitDates,
    };
  }

  @Post('reserve/:visitDateID')
  @Role(Roles.User)
  async reserveVisitDate(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Param('visitDateID') visitDateID: string,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    const userWithReservedVisitDate = await this.datesService.reserveVisitDate(
      visitDateID,
      userWithUpdatedTokens._id,
    );
    const { accessToken, futureVisitDates } = userWithReservedVisitDate;
    return { accessToken, futureVisitDates };
  }

  @Post('confirm/:visitDateID')
  @Role(Roles.Admin)
  async confirmUserFutureVisitDate(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Param('visitDateID') visitDateID: string,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    await this.datesService.confirmVisitDate(visitDateID);
    const { accessToken } = userWithUpdatedTokens;
    return { accessToken, message: 'Visit date successfully confirmed' };
  }

  @Post('refuse/:visitDateID')
  @Role(Roles.User)
  async refuseVisitDate(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Param('visitDateID') visitDateID: string,
  ) {
    const userWithUpdatedTokens = await this.userService.updateUserTokens(
      req,
      res,
    );
    const userWithoutVisitDate = await this.datesService.refuseVisitDate(
      visitDateID,
      userWithUpdatedTokens._id,
    );
    const { accessToken, futureVisitDates } = userWithoutVisitDate;
    return { accessToken, futureVisitDates };
  }
}
