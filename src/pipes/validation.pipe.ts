import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ObjectSchema } from 'joi';

import extractJoiErrorLabel from 'src/helpers/extractJoiErrorLabel';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private schema: ObjectSchema) { }
    
    transform(value: any) {
        const { error } = this.schema.validate(value);
        if (error) {
            const errorLabel = extractJoiErrorLabel(error.details);
            throw new BadRequestException(`${errorLabel} validation failed`);
        }
        return value;
    }
}