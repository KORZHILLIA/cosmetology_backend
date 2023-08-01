import { Controller, Post, Get, Body, Param, Response, UsePipes, Redirect, Request, UseGuards } from '@nestjs/common';
import { Response as Res, Request as Req } from 'express';

import { UsersService } from './users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';
import { UsersGuard } from './users.guard';

import { SignupReqBody, ResendEmailReqBody, SigninReqBody } from 'src/interfaces/user.interface';
import joiSignupSchema from 'src/schemas/user.joiSignupSchema';
import joiResendEmailSchema from 'src/schemas/user.joiResendEmailSchema';
import joiSigninSchema from 'src/schemas/user.joiSigninSchema';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }
    
    @Post('signup')
        @UsePipes(new JoiValidationPipe(joiSignupSchema))
    async signup(@Body() user: SignupReqBody) {
        await this.usersService.checkIsUserNotInDBByEmail(user.email);
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
        @UsePipes(new JoiValidationPipe(joiResendEmailSchema))
    async resendEmail(@Body() {email}: ResendEmailReqBody) {
        const user = await this.usersService.retrieveUnverificatedUser(email);
        await this.usersService.sendVerificationMail(user.email, user.verificationToken);
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
    async signin(@Body() user: SigninReqBody, @Response({passthrough: true}) res: Res) {
        const signedUser = await this.usersService.updateUserIsSigned(user.email, user.password);
            res.cookie('refresh-token', signedUser.refreshToken, {
                httpOnly: true,
                secure: false,
            });
            return signedUser;
    }


    // @UseGuards(UsersGuard)
    // @Get('profile')
    // getProfle(@Request() req) {
    //     return req.user;
    // }

    @UseGuards(UsersGuard)
    @Get('profile')
    getProfle(@Request() req: Req) {
        return req['user'];
    }
}