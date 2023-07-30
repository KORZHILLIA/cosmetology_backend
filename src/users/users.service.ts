import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from "mongoose";
import { nanoid } from 'nanoid';

import { User } from "src/schemas/user.mongooseSchema";
import { SignupReqBody } from "src/interfaces/user.interface";

import hashPassword from 'src/helpers/hashPassword';
import sendMail from "src/helpers/sendMail";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService, private configService: ConfigService) { }

    async findUserByEmail(email: string): Promise<void> {
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
}