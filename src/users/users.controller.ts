import {
  Controller,
  Post,
  Patch,
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
  OuterSignupReqBody,
  ResendEmailReqBody,
  SigninReqBody,
  SignoutReqBody,
  PostConfirmVisitDateBody,
  ChangePasswordBody,
} from 'src/interfaces/user.interface';
import Roles from 'src/roles/roles.enum';
import cookieConfig from 'src/constants/cookieConfig';
import joiSignupSchema from 'src/schemas/user.joiSignupSchema';
import joiResendEmailSchema from 'src/schemas/user.joiResendEmailSchema';
import joiSigninSchema from 'src/schemas/user.joiSigninSchema';
import joiPostConfirmVisitDateSchema from 'src/schemas/user.joiPostConfirmVisitDateSchema';
import joiChangePasswordSchema from 'src/schemas/user.joiChangePasswordSchema';

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

  @Post('signin')
  @UsePipes(new JoiValidationPipe(joiSigninSchema))
  async signin(
    @Body() body: SigninReqBody,
    @Response({ passthrough: true }) res: Res,
  ) {
    const signedUser = await this.usersService.updateUserIsSigned(
      body.email,
      body.password,
      body.isRemember,
    );
    const {
      role,
      name,
      email,
      isVerified,
      isSigned,
      accessToken,
      refreshToken,
      futureVisitDates,
      pastVisitDates,
    } = signedUser;
    res.cookie('refresh-token', refreshToken, {
      ...cookieConfig,
      sameSite: 'none',
    });
    return {
      role,
      name,
      email,
      isVerified,
      isSigned,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    };
  }

  @Post('signupouter')
  async outerSignup(
    @Body() body: OuterSignupReqBody,
    @Response({ passthrough: true }) res: Res,
  ) {
    const newOuterUser = await this.usersService.signupOuterUser(body);
    const {
      role,
      name,
      email,
      isVerified,
      isSigned,
      accessToken,
      refreshToken,
      futureVisitDates,
      pastVisitDates,
    } = newOuterUser;
    res.cookie('refresh-token', refreshToken, {
      ...cookieConfig,
      sameSite: 'none',
    });
    return {
      role,
      name,
      email,
      isVerified,
      isSigned,
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
      role,
      name,
      email,
      isVerified,
      isSigned,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    } = userWithUpdatedTokens;
    return {
      role,
      name,
      email,
      isVerified,
      isSigned,
      accessToken,
      futureVisitDates,
      pastVisitDates,
    };
  }

  @Post('signout')
  async signout(@Body() body: SignoutReqBody) {
    await this.usersService.signoutUser(body.email);
    return { message: 'Successfully signed out' };
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

  @Post('postconfirm/:userEmail')
  @Role(Roles.Admin)
  async postConfirm(
    @Request() req: Req,
    @Response({ passthrough: true }) res: Res,
    @Param('userEmail') userEmail: string,
    @Body(new JoiValidationPipe(joiPostConfirmVisitDateSchema))
    body: PostConfirmVisitDateBody,
  ) {
    const userWithUpdatedTokens = await this.usersService.updateUserTokens(
      req,
      res,
    );
    const { email, pastVisitDates } =
      await this.usersService.postConfirmVisitDate(userEmail, body.visitDate);
    return {
      accessToken: userWithUpdatedTokens.accessToken,
      email,
      pastVisitDates,
    };
  }

  @Get('forgotpassword/:userEmail')
  async askToChangePassword(@Param('userEmail') userEmail: string) {
    const email = await this.usersService.askToUpdatePassword(userEmail);
    return { email, message: 'You now may change your password' };
  }

  @Patch('newpassword/:userEmail')
  async changePassword(
    @Param('userEmail') userEmail: string,
    @Body(new JoiValidationPipe(joiChangePasswordSchema))
    body: ChangePasswordBody,
  ) {
    const { email } = await this.usersService.updatePassword(
      userEmail,
      body.password,
    );
    return { email, message: 'Password changed' };
  }
}
