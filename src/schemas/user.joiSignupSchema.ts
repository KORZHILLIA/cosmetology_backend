import * as Joi from 'joi';

import { emailRegexp, passwordRegexp } from 'src/constants/regexp';

const joiSignupSchema = Joi.object({
  name: Joi.string().min(4).max(20).required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().pattern(passwordRegexp).required(),
});

export default joiSignupSchema;
