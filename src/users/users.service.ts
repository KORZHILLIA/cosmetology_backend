import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from "mongoose";
// import  { nanoid } from 'nanoid';

import { User } from "src/schemas/user.schema";
import { SignupReqBody } from "src/interfaces/user.interface";

import hashPassword from 'src/helpers/hashPassword';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async findUserByEmail(email: string): Promise<boolean> {
        return await this.userModel.findOne({ email });
    }

    async createNewUser(user: SignupReqBody) {
        const hashedPassword = await hashPassword(user.password);
        const verificationToken = 'hjiu890';
        const newUser = await this.userModel.create({ ...user, password: hashedPassword, verificationToken });
        return newUser;
    }
}