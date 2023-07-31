import * as bcrypt from 'bcryptjs';

const comparePasswords = (pass: string, hashedPass: string):boolean => {
    return bcrypt.compare(pass, hashedPass);
};

export default comparePasswords;