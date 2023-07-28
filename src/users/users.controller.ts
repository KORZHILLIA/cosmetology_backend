import { Controller, Post, Body } from '@nestjs/common';

import { UsersService } from './users.service';

import { User } from 'src/interfaces/user.interface';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }
    
    @Post()
    add(@Body() user: User) {
        return this.usersService.add(user);
    }

}