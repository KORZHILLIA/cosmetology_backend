import * as Joi from 'joi';

import { emailRegexp, passwordRegexp } from 'src/constants/regexp';

const joiSigninSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().pattern(passwordRegexp).required(),
});

export default joiSigninSchema;
