import * as Joi from 'joi';

import { emailRegexp } from 'src/constants/regexp';

const joiResendEmailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

export default joiResendEmailSchema;
