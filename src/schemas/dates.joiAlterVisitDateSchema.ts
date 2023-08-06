import * as Joi from 'joi';

import Roles from 'src/roles/roles.enum';

const joiAlterVisitDateSchema = Joi.object({
  role: Joi.string().valid(Roles.Admin).required(),
  alteredDate: Joi.number().required(),
});

export default joiAlterVisitDateSchema;
