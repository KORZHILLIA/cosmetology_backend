import { Controller, Post, Get, Body, Param, UsePipes, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

import { UsersService } from './users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';

import { SignupReqBody } from 'src/interfaces/user.interface';
import joiSignupUserSchema from 'src/schemas/user.joiSignupSchema';

import sendMail from 'src/helpers/sendMail';


@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService, private configService: ConfigService) { }
    
    @Post('signup')
        @UsePipes(new JoiValidationPipe(joiSignupUserSchema))
    async signup(@Body() user: SignupReqBody) {
        const isUserInDB = await this.usersService.findUserByEmail(user.email);
        if (isUserInDB) {
            throw new ConflictException('This email already in use');
        }
        const newUser = await this.usersService.createNewUser(user);
        const sendgridKey = this.configService.get<string>('SENDGRID_KEY');
        const isMailSent = await sendMail(sendgridKey, newUser.email, newUser.verificationToken);
        if (typeof isMailSent === 'boolean') {
            return newUser;
        } else {
            throw new ForbiddenException('Confirmation email was not sent');
        }
    }

    @Get('verify/:verificationToken')
    async verify(@Param('verificationToken') verificationToken: string) {
        const isUserInDB = await this.usersService.findUserByVerificationToken(verificationToken);
        if (!isUserInDB) {
            throw new NotFoundException('User not found');
        }
        const verifiedUser = await this.usersService.updateUserIsVerified(isUserInDB._id);
        return verifiedUser;
    }
}