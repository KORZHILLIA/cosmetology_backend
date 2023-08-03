import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Response,
  UsePipes,
  Redirect,
  Request,
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
  ReserveVisitDateBody,
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
    @Param('visitDateID') visitDateID: string,
    @Body() body: ReserveVisitDateBody,
  ) {
    const userWithReservedVisitDate = await this.datesService.reserveVisitDate(
      visitDateID,
      body.userID,
    );
    return userWithReservedVisitDate;
  }
}
