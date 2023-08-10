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

import { UsersService } from './users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';
import { UsersGuard } from './users.guard';
import { Role } from 'src/roles/roles.decorator';
import { RolesGuard } from 'src/roles/roles.guard';

import {
  SignupReqBody,
  ResendEmailReqBody,
  SigninReqBody,
} from 'src/interfaces/user.interface';
import Roles from 'src/roles/roles.enum';
import joiSignupSchema from 'src/schemas/user.joiSignupSchema';
import joiResendEmailSchema from 'src/schemas/user.joiResendEmailSchema';
import joiSigninSchema from 'src/schemas/user.joiSigninSchema';

@UseGuards(RolesGuard, UsersGuard)
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(joiSignupSchema))
  async signup(@Body() user: SignupReqBody) {
    await this.usersService.signupUser(user);
    return { message: 'Confirmation email has been sent' };
  }

  @Get('verify/:verificationToken')
  @Redirect()
  async verify(@Param('verificationToken') verificationToken: string) {
    const encodedURL = await this.usersService.verifyUser(verificationToken);
    return { url: encodedURL };
  }

  @Get('resendEmail')
  @UsePipes(new JoiValidationPipe(joiResendEmailSchema))
  async resendEmail(@Body() body: ResendEmailReqBody) {
    await this.usersService.resendVerificationEmail(body.email);
    return { message: 'Confirmation email has been sent again' };
  }

  // @Post('signin')
  // @UsePipes(new JoiValidationPipe(joiSigninSchema))
  // async signin(@Body() user: SigninReqBody, @Response() res: Res) {
  //     const signedUser = await this.usersService.updateUserIsSigned(user.email, user.password);
  //     return res.set({ 'refresh-token': signedUser.refreshToken }).json(signedUser);
  // }

  @Post('signin')
  @UsePipes(new JoiValidationPipe(joiSigninSchema))
  async signin(
    @Body() user: SigninReqBody,
    @Response({ passthrough: true }) res: Res,
  ) {
    const signedUser = await this.usersService.updateUserIsSigned(
      user.email,
      user.password,
    );
    const {
      name,
      email,
      isVerified,
      accessToken,
      refreshToken,
      futureVisitDates,
      pastVisitDates,
    } = signedUser;
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: false,
      domain: 'http://localhost:3000',
      sameSite: 'strict',
    });
    return {
      name,
      email,
      isVerified,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    };
  }

  @Get('current')
  async getProfle(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
  ) {
    const userWithUpdatedTokens = await this.usersService.updateUserTokens(
      req,
      res,
    );
    const {
      name,
      email,
      isVerified,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    } = userWithUpdatedTokens;
    return {
      name,
      email,
      isVerified,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    };
  }

  @Get('all')
  @Role(Roles.Admin)
  async getAll(@Request() req: Req, @Response({ passthrough: true }) res: Res) {
    const userWithUpdatedTokens = await this.usersService.updateUserTokens(
      req,
      res,
    );
    const users = await this.usersService.getAllUsers();
    return { accsessToken: userWithUpdatedTokens.accessToken, users };
  }
}
