import { Injectable } from "@nestjs/common";

import { User } from "src/interfaces/user.interface";

@Injectable()
export class UsersService {
    private readonly users: User[] = [];

    add(user: User) {
        this.users.push(user);
        return this.users;
    }
}