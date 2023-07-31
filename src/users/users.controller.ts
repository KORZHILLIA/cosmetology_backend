import { Controller, Post, Get, Body, Param, UsePipes, Redirect } from '@nestjs/common';

import { UsersService } from './users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';

import { SignupReqBody, ResendEmailReqBody } from 'src/interfaces/user.interface';
import joiSignupUserSchema from 'src/schemas/user.joiSignupSchema';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }
    
    @Post('signup')
        @UsePipes(new JoiValidationPipe(joiSignupUserSchema))
    async signup(@Body() user: SignupReqBody) {
        await this.usersService.findUserByEmail(user.email);
        const newUser = await this.usersService.createNewUser(user);
        await this.usersService.sendVerificationMail(newUser.email, newUser.verificationToken);
        return {message: 'Confirmation email has been sent'};
    }

    @Get('verify/:verificationToken')
        @Redirect()
    async verify(@Param('verificationToken') verificationToken: string) {
        const userWithToken = await this.usersService.findUserByVerificationToken(verificationToken);
        const verifiedUser = await this.usersService.updateUserIsVerified(userWithToken._id);
        const encodedUrl = this.usersService.prepareEncodedURL(verifiedUser.name, verifiedUser.email);
        return {url: encodedUrl};
    }

    @Get('resendEmail')
    async resendEmail(@Body() {email}: ResendEmailReqBody) {
        const user = await this.usersService.retrieveUnverificatedUser(email);
        await this.usersService.sendVerificationMail(user.email, user.verificationToken);
        return { message: 'Confirmation email has been sent again' };
    }
}