import { Controller, Post, Body, ConflictException } from '@nestjs/common';

import { UsersService } from './users.service';

import { SignupReqBody } from 'src/interfaces/user.interface';
import { User } from 'src/schemas/user.schema';


@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }
    
    @Post()
    async signup(@Body() user: SignupReqBody) {
        const isUserInDB = await this.usersService.findUserByEmail(user.email);
        if (isUserInDB) {
            throw new ConflictException('This email already in use');
        }
        const newUser = await this.usersService.createNewUser(user);
        return newUser;
    }

}