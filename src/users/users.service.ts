import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from "mongoose";
import { nanoid } from 'nanoid';

import { User } from "src/schemas/user.mongooseSchema";
import { SignupReqBody } from "src/interfaces/user.interface";

import hashPassword from 'src/helpers/hashPassword';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService) { }

    async findUserByEmail(email: string): Promise<boolean> {
        return await this.userModel.findOne({ email });
    }

    async createNewUser(user: SignupReqBody) {
        const hashedPassword = await hashPassword(user.password);
        const verificationToken = nanoid(5);
        const newUser = await this.userModel.create({ ...user, password: hashedPassword, verificationToken });
        return newUser;
    }

    async findUserByVerificationToken(verificationToken: string) {
        return await this.userModel.findOne({ verificationToken });
    }

    async updateUserIsVerified(userId: Types.ObjectId) {
        return await this.userModel.findByIdAndUpdate(userId, {isVerified: true, verificationToken: ''}, {new: true});
    }
}