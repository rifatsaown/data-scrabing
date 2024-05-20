import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { ApiResponse } from '../../../utils/ApiResponse';
import { formHandleService } from './formHandle.service';

export const formHandler = async (req: Request, res: Response, next:NextFunction) => {
    try {
        const uploadFile = req.file;
        if (!uploadFile) {
            return res.status(400).json(new ApiResponse(400 ,'File is Required'));
        }
       const result = await formHandleService.processCSV(path.resolve(uploadFile.path));

        return res.status(200).json(new ApiResponse(200, result));
    } catch (error) {
        next(error);
    }
};