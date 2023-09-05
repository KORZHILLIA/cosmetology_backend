import * as Joi from 'joi';

import { passwordRegexp } from 'src/constants/regexp';

const joiChangePasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordRegexp).required(),
});

export default joiChangePasswordSchema;
