import * as Joi from 'joi';

import Roles from 'src/roles/roles.enum';

const joiPostConfirmVisitDateSchema = Joi.object({
  role: Joi.string().valid(Roles.Admin).required(),
  visitDate: Joi.string().required(),
});

export default joiPostConfirmVisitDateSchema;
