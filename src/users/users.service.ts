    import { Injectable, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
    import { ConfigService } from "@nestjs/config";
    import { JwtService } from "@nestjs/jwt";
import { InjectModel } from '@nestjs/mongoose';
    import { Response as Res, Request as Req } from 'express';
    import { Model, Types } from "mongoose";
    import { nanoid } from 'nanoid';

    import { User } from "src/schemas/user.mongooseSchema";
    import { SignupReqBody, PayloadForTokens, TokensPair } from "src/interfaces/user.interface";
    import Roles from "src/roles/roles.enum";

    import hashPassword from 'src/helpers/hashPassword';
    import sendMail from "src/helpers/sendMail";
    import encodeStringForURL from "src/helpers/encodeStringForURL";
    import comparePasswords from "src/helpers/comparePasswords";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService, private configService: ConfigService) { }

    async signupUser(user: SignupReqBody) {
        await this.checkIsUserNotInDBByEmail(user.email);
        const newUser = await this.createNewUser(user);
        await this.sendVerificationEmail(newUser.email, newUser.verificationToken);
    }

    async checkIsUserNotInDBByEmail(email: string): Promise<void> {
        const user = await this.userModel.findOne({ email });
        if (user) {
          throw new ConflictException('This email already in use');
        } 
    }

    async createNewUser(user: SignupReqBody) {
        const hashedPassword = await hashPassword(user.password);
        const newUserCredentials = this.createNewUserCredentials(user, hashedPassword);
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
        const userNotPreparedForVerificationYet = await this.findUserByVerificationToken(verificationToken);
        const userPreparedForVerification = await this.updateUserIsVerified(userNotPreparedForVerificationYet._id);
        const encodedURL = this.prepareEncodedURL(userPreparedForVerification.name, userPreparedForVerification.email);
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
        return await this.userModel.findByIdAndUpdate(userId, {isVerified: true, verificationToken: ''}, {new: true});
    }

    async resendVerificationEmail(email: string): Promise<void> {
        const userNotVerifiedYet = await this.retrieveUnverificatedUser(email);
        await this.sendVerificationEmail(userNotVerifiedYet.email, userNotVerifiedYet.verificationToken);
    }

    async retrieveUnverificatedUser(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('User not found');
        } if (user.isVerified) {
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

    async updateUserIsSigned(email: string, password: string) {
        const user = await this.checkIsUserInDBByEmail(email);
        if (!user.isVerified) {
            throw new ConflictException('Please verify your email first');
        }
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('This password is invalid');
        }
        const payload = { sub: user.email, username: user.name };
        const { accessToken, refreshToken } = await this.prepareTokens(payload);
        const signedUser = await this.userModel.findByIdAndUpdate(user._id, { accessToken, refreshToken }, { new: true });
        return signedUser;
    }

    async getCurrentUser(email: string) {
        const user = await this.checkIsUserInDBByEmail(email);
        const payload = { sub: user.email, username: user.name };
        const { accessToken, refreshToken } = await this.prepareTokens(payload);
        const userWithUpdatedTokens = await this.userModel.findByIdAndUpdate(user._id, { accessToken, refreshToken }, { new: true });
        return userWithUpdatedTokens;
    }

    async prepareTokens(payload: PayloadForTokens): Promise<TokensPair> {
        const accessSecret = this.configService.get<string>('ACCESS_SECRET');
        const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
        const accessToken = await this.jwtService.signAsync(payload, { secret: accessSecret, expiresIn: '20m' });
        const refreshToken = await this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: '1d' });
        return { accessToken, refreshToken };
    }

    async getAllUsers() {
        const users = await this.userModel.find({ role: 'user' });
        return users;
    }

    async updateUserTokens(req: Req, res: Res) {
        const { sub } = req['user'];
        const userWithUpdatedTokens = await this.getCurrentUser(sub);
        res.cookie('refresh-token', userWithUpdatedTokens.refreshToken, {
            httpOnly: true,
            secure: false,
        });
        return userWithUpdatedTokens;
    }

    prepareEncodedURL(userName: string, userEmail: string): string {
        const baseUrl = this.configService.get<string>('BASE_URL');
        const encodedUserName = encodeStringForURL(userName);
        const encodedEmail = encodeStringForURL(userEmail);
        const encodedUrl = `${baseUrl}?userName=${encodedUserName}&userEmail=${encodedEmail}`;
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