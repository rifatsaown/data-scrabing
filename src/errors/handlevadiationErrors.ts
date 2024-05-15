import mongoose from 'mongoose'
import { IErrorSources, IGenericErrorResponse } from '../interfaces/error'

// ValidationError is thrown when a document fails validation. This error can be caught and handled by the handleValidationError function.
const handleValidationError = (
  err: mongoose.Error.ValidationError
): IGenericErrorResponse => {
  const errorSources: IErrorSources = Object.values(err.errors).map(
    (val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        path: val?.path,
        message: val?.message,
      }
    }
  )

  const statusCode = 400

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  }
}

export default handleValidationError
