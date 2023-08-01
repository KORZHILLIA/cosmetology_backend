import { Injectable, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from "mongoose";
import { nanoid } from 'nanoid';

import { User } from "src/schemas/user.mongooseSchema";
import { SignupReqBody } from "src/interfaces/user.interface";

import hashPassword from 'src/helpers/hashPassword';
import sendMail from "src/helpers/sendMail";
import encodeStringForURL from "src/helpers/encodeStringForURL";
import comparePasswords from "src/helpers/comparePasswords";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService, private configService: ConfigService) { }

    async checkIsUserNotInDBByEmail(email: string): Promise<void> {
        const user = await this.userModel.findOne({ email });
        if (user) {
throw new ConflictException('This email already in use');
        } 
    }

    async createNewUser(user: SignupReqBody) {
        const hashedPassword = await hashPassword(user.password);
        const verificationToken = nanoid(5);
        const newUser = await this.userModel.create({ ...user, password: hashedPassword, verificationToken });
        return newUser;
    }

    async sendVerificationMail(email: string, token: string): Promise<void> {
        const sendgridKey = this.configService.get<string>('SENDGRID_KEY');
const isMailSent = await sendMail(sendgridKey, email, token);
        if (typeof isMailSent !== 'boolean') {
            throw new ForbiddenException('Confirmation email was not sent');
        }
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

    async retrieveUnverificatedUser(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('User not found');
        } if (user.isVerified) {
            throw new ConflictException('This user already verified');
        }
        return user;
    }

    async checkIsUserInDBByEmail(email: string): Promise<void> {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('There is no user with this email');
        }
    }

    async updateUserIsSigned(email: string, password: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('There is no user with this email');
        }
        if (!user.isVerified) {
            throw new ConflictException('Please verify your email first');
        }
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('This password is invalid');
        }
        const payload = { sub: user.email, username: user.name };
        const accessSecret = this.configService.get<string>('ACCESS_SECRET');
        const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
        const accessToken = await this.jwtService.signAsync(payload, { secret: accessSecret, expiresIn: '20m' });
        const refreshToken = await this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: '1d' });
        return await this.userModel.findByIdAndUpdate(user._id, {accessToken, refreshToken}, {new: true});
    }

    prepareEncodedURL(userName: string, userEmail: string): string {
        const baseUrl = this.configService.get<string>('BASE_URL');
        const encodedUserName = encodeStringForURL(userName);
        const encodedEmail = encodeStringForURL(userEmail);
        const encodedUrl = `${baseUrl}?userName=${encodedUserName}&userEmail=${encodedEmail}`;
        return encodedUrl;
    }
}