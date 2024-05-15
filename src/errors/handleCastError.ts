import mongoose from 'mongoose'
import { IErrorSources, IGenericErrorResponse } from '../interfaces/error'

//CastError is thrown when a value is passed to mongoose that is not a valid type for the Schema type it is defined in. For example, passing a string to a Number type field. This error can be caught and handled by the handleCastError function.
const handleCastError = (
  err: mongoose.Error.CastError
): IGenericErrorResponse => {
  const errorSources: IErrorSources = [
    {
      path: err.path,
      message: err.message,
    },
  ]

  const statusCode = 400

  return {
    statusCode,
    message: 'Invalid ID',
    errorSources,
  }
}

export default handleCastError
