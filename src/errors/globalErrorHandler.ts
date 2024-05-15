import { ErrorRequestHandler } from 'express'
import configs from '../configs'
import { IErrorSources } from '../interfaces/error'
import handleCastError from './handleCastError'
import handleDuplicateError from './handleDuplicateError'
import handleValidationError from './handlevadiationErrors'

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (configs.env === 'development') console.log(err) //logging the error in development mode only
  //setting default values
  let statusCode = 500
  let message = 'Something went wrong!'
  let errorSources: IErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ]

  /* handling different types of errors and setting the response */

  //validation error 
  if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err)
    statusCode = simplifiedError?.statusCode
    message = simplifiedError?.message
    errorSources = simplifiedError?.errorSources
  } 
  
  // cast error
  else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err)
    statusCode = simplifiedError?.statusCode
    message = simplifiedError?.message
    errorSources = simplifiedError?.errorSources
  } 
  
  // duplicate error
  else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err)
    statusCode = simplifiedError?.statusCode
    message = simplifiedError?.message
    errorSources = simplifiedError?.errorSources
  } 
  
  // custom error
  else if (err instanceof Error) {
    message = err.message
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ]
  }

  //ultimate return 
  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err,
    stack: configs.env === 'development' ? err?.stack : null,
  })
}

export default globalErrorHandler
