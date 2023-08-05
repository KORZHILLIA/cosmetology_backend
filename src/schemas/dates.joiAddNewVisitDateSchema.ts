import * as Joi from 'joi';

import Roles from 'src/roles/roles.enum';

const joiAddNewVisitDateSchema = Joi.object({
  role: Joi.string().valid(Roles.Admin).required(),
  dates: Joi.array().items(Joi.number()),
});

export default joiAddNewVisitDateSchema;
