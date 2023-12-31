import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Response as Res, Request as Req } from 'express';
import { Model, Types } from 'mongoose';
import { nanoid } from 'nanoid';

import { User } from 'src/schemas/user.mongooseSchema';
import { VisitDate } from 'src/schemas/dates.mongooseSchema';
import {
  SignupReqBody,
  OuterSignupReqBody,
  PayloadForTokens,
  TokensPair,
} from 'src/interfaces/user.interface';
import cookieConfig from 'src/constants/cookieConfig';
import Roles from 'src/roles/roles.enum';

import hashPassword from 'src/helpers/hashPassword';
import sendMail from 'src/helpers/sendMail';
import encodeStringForURL from 'src/helpers/encodeStringForURL';
import comparePasswords from 'src/helpers/comparePasswords';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(VisitDate.name) private visitDateModel: Model<VisitDate>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signupUser(user: SignupReqBody) {
    await this.checkIsUserNotInDBByEmail(user.email);
    const newUser = await this.createNewUser(user);
    await this.sendVerificationEmail(newUser.email, newUser.verificationToken);
  }

  async signupOuterUser(body: OuterSignupReqBody) {
    const { name, email } = body;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      const hashedPassword = await hashPassword(nanoid(8));
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const userRole = email === adminEmail ? Roles.Admin : Roles.User;

      const payload = { sub: email, username: name };
      const { accessToken, refreshToken } = await this.prepareTokens(payload);

      const newOuterUser = await this.userModel.create({
        name,
        email,
        role: userRole,
        password: hashedPassword,
        accessToken,
        refreshToken,
        isVerified: true,
        isSigned: true,
        isOuter: true,
      });
      return newOuterUser;
    }
    if (user && user.isOuter) {
      await this.cleanDeadVisitDatesRefs(user);
      const payload = { sub: user.email, username: user.name };
      const { accessToken, refreshToken } = await this.prepareTokens(payload);
      const userWithUpdatedTokens = await this.userModel
        .findByIdAndUpdate(
          user._id,
          { accessToken, refreshToken, isSigned: true },
          { new: true },
        )
        .populate('futureVisitDates');
      return userWithUpdatedTokens;
    }
    if (user && !user.isOuter) {
      throw new ConflictException(
        'This user already exists. Try enter by email/password',
      );
    }
  }

  async checkIsUserNotInDBByEmail(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new ConflictException('This email already in use');
    }
  }

  async createNewUser(user: SignupReqBody) {
    const hashedPassword = await hashPassword(user.password);
    const newUserCredentials = this.createNewUserCredentials(
      user,
      hashedPassword,
    );
    const newUser = await this.userModel.create(newUserCredentials);
    return newUser;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const sendgridKey = this.configService.get<string>('SENDGRID_KEY');
    const isMailSent = await sendMail(sendgridKey, email, token);
    if (typeof isMailSent !== 'boolean') {
      throw new ForbiddenException('Confirmation email was not sent');
    }
  }

  async verifyUser(verificationToken: string) {
    const userNotPreparedForVerificationYet =
      await this.findUserByVerificationToken(verificationToken);
    const userPreparedForVerification = await this.updateUserIsVerified(
      userNotPreparedForVerificationYet._id,
    );
    const encodedURL = this.prepareEncodedURL(
      userPreparedForVerification.email,
    );
    return encodedURL;
  }

  async findUserByVerificationToken(verificationToken: string) {
    const user = await this.userModel.findOne({ verificationToken });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserIsVerified(userId: Types.ObjectId) {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { isVerified: true, verificationToken: '' },
      { new: true },
    );
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const userNotVerifiedYet = await this.retrieveUnverificatedUser(email);
    await this.sendVerificationEmail(
      userNotVerifiedYet.email,
      userNotVerifiedYet.verificationToken,
    );
  }

  async retrieveUnverificatedUser(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isVerified) {
      throw new ConflictException('This user already verified');
    }
    return user;
  }

  async checkIsUserInDBByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('There is no user with this email');
    }
    return user;
  }

  async updateUserIsSigned(
    email: string,
    password: string,
    isRemember: boolean,
  ) {
    const user = await this.checkIsUserInDBByEmail(email);
    if (!user.isVerified) {
      throw new ConflictException('Please verify your email first');
    }
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('This password is invalid');
    }
    const payload = { sub: user.email, username: user.name };
    const { accessToken, refreshToken } = await this.prepareTokens(
      payload,
      isRemember,
    );
    const signedUser = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { accessToken, refreshToken, isSigned: true },
        { new: true },
      )
      .populate('futureVisitDates');
    return signedUser;
  }

  async getCurrentUser(email: string) {
    const user = await this.checkIsUserInDBByEmail(email);
    await this.cleanDeadVisitDatesRefs(user);
    const payload = { sub: user.email, username: user.name };
    const { accessToken, refreshToken } = await this.prepareTokens(payload);
    const userWithUpdatedTokens = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { accessToken, refreshToken, isSigned: true },
        { new: true },
      )
      .populate('futureVisitDates');
    return userWithUpdatedTokens;
  }

  async signoutUser(email: string) {
    const user = await this.checkIsUserInDBByEmail(email);
    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        accessToken: '',
        refreshToken: '',
      },
      { new: true },
    );
  }

  async prepareTokens(
    payload: PayloadForTokens,
    isRemember: boolean = false,
  ): Promise<TokensPair> {
    const accessSecret = this.configService.get<string>('ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: isRemember ? '60m' : '30m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: isRemember ? '14d' : '7d',
    });
    return { accessToken, refreshToken };
  }

  async getAllUsers() {
    const users = await this.userModel.find({ role: 'user' });
    return users;
  }

  async postConfirmVisitDate(userEmail: string, visitDate: string) {
    const user = await this.checkIsUserInDBByEmail(userEmail);
    const requiredIdx = user.pastVisitDates.findIndex(
      (obj) => obj.date.toISOString() === visitDate,
    );
    user.pastVisitDates.splice(requiredIdx, 1, {
      date: new Date(visitDate),
      postConfirmed: true,
    });
    await user.save();
    return user;
  }

  async askToUpdatePassword(userEmail: string) {
    const user = await this.checkIsUserInDBByEmail(userEmail);
    if (user.isOuter) {
      throw new ConflictException(
        'No password provided, try to enter via Google',
      );
    }
    if (!user.isVerified) {
      throw new ConflictException('Please verify your email first');
    }
    return user.email;
  }

  async updatePassword(userEmail: string, password: string) {
    const user = await this.checkIsUserInDBByEmail(userEmail);
    const hashedPassword = await hashPassword(password);
    const userWithUpdatedPassword = await this.userModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
      },
      { new: true },
    );
    return userWithUpdatedPassword;
  }

  async updateUserTokens(req: Req, res: Res) {
    const { sub } = req['user'];
    const userWithUpdatedTokens = await this.getCurrentUser(sub);
    res.cookie('refresh-token', userWithUpdatedTokens.refreshToken, {
      ...cookieConfig,
      sameSite: 'none',
    });
    return userWithUpdatedTokens;
  }

  async cleanDeadVisitDatesRefs(user: User & { _id: Types.ObjectId }) {
    await user.futureVisitDates.forEach(async (date) => {
      const isDateAlive = await this.visitDateModel.findOne({ _id: date });
      if (!isDateAlive) {
        await this.userModel.findByIdAndUpdate(user._id, {
          $pull: { futureVisitDates: date },
        });
      }
    });
  }

  prepareEncodedURL(userEmail: string): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL');
    const encodedEmail = encodeStringForURL(userEmail);
    const encodedUrl = `${baseUrl}?userEmail=${encodedEmail}`;
    return encodedUrl;
  }

  createNewUserCredentials(user: SignupReqBody, password: string) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const verificationToken = nanoid(5);
    const newUserCredentials = { ...user, password, verificationToken };
    if (user.email === adminEmail) {
      newUserCredentials['role'] = Roles.Admin;
    }
    return newUserCredentials;
  }
}
