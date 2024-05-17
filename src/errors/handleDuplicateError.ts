/* eslint-disable @typescript-eslint/no-explicit-any */

import { IErrorSources, IGenericErrorResponse } from '../interfaces/error';

// Duplicate error is thrown when a unique field is duplicated in the database. This error can be caught and handled by the handleDuplicateError function.
const handleDuplicateError = (err: any): IGenericErrorResponse => {
  // Extract value within double quotes using regex
  const match = err.message.match(/"([^"]*)"/);

  // The extracted value will be in the first capturing group
  const extractedMessage = match && match[1];

  const errorSources: IErrorSources = [
    {
      path: '',
      message: `${extractedMessage} is already exists`,
    },
  ]

  const statusCode = 400;

  return {
    statusCode,
    message: 'Invalid ID',
    errorSources,
  }
}

export default handleDuplicateError;