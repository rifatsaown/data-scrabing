import { NextFunction, Request, Response } from 'express'
import { ApiResponse } from '../../../utils/ApiResponse'
import { userServices } from './users.service'

export const getAllusers = async (req: Request,res: Response, next: NextFunction) => {
  try {
    const result = await userServices.getUsers()
    // console.log(result)
   res.status(200).json(new ApiResponse(200, result))
  } catch (error) {
    next(error)
  }
}

export const createUser = async ( req: Request, res: Response, next: NextFunction) => 
  {
  try {
    const result = await userServices.createUser(req)
    res.status(200).json(new ApiResponse(200, result))
  } catch (error) {
    next(error)
  }
}