import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Error } from 'mongoose';

@Catch(Error)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const message = exception.message;
    const response = context.getResponse();
    response.status(500).json({ message });
  }
}
