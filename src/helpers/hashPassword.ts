const bcrypt = require("bcryptjs");

const hashPassword = (userPassword: string): string => {
    return bcrypt.hash(userPassword, 10);
};

export default hashPassword;