import { Controller, Post, Body, UsePipes, ConflictException } from '@nestjs/common';

import { UsersService } from './users.service';
import { JoiValidationPipe } from 'src/pipes/validation.pipe';

import { SignupReqBody } from 'src/interfaces/user.interface';
import joiSignupUserSchema from 'src/schemas/user.joiSignupSchema';

import sendMail from 'src/helpers/sendMail';


@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }
    
    @Post()
        @UsePipes(new JoiValidationPipe(joiSignupUserSchema))
    async signup(@Body() user: SignupReqBody) {
        const isUserInDB = await this.usersService.findUserByEmail(user.email);
        if (isUserInDB) {
            throw new ConflictException('This email already in use');
        }
        const newUser = await this.usersService.createNewUser(user);
        const isMailSent = await sendMail(newUser.email, newUser.verificationToken);
        return newUser;
    }

}