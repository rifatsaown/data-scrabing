import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { ApiResponse } from '../../../utils/ApiResponse';
import { saveDataEXL } from '../Scrapper/scrapper.controller';
import { formHandleService } from './formHandle.service';

export const formHandler = async (req: Request, res: Response, next:NextFunction) => {
    try {
        const uploadFile = req.files as unknown as {[fieldname: string]: Express.Multer.File[]};
        const idFile = uploadFile?.idFile?.[0];
        const dataFile = uploadFile?.dataFile?.[0];

        // id file is required
        if (!idFile) {
            return res.status(400).json(new ApiResponse(400, 'ID File is Required'));
        }

        // if only id file is uploaded
        if (!dataFile && idFile) {
            const result = await formHandleService.processCSV(path.resolve(idFile?.path));
            req.body.clientID = result;
            req.body.dataFileTrue = false;
            saveDataEXL(req, res, next);
        }

        // if both files are uploaded
        if (idFile && dataFile) {
            const clientIDs = await formHandleService.processCSV(path.resolve(idFile?.path));
            req.body.clientID = clientIDs;
            req.body.dataFileTrue = true;
            req.body.dataFilePath = path.resolve(dataFile?.path);
            saveDataEXL(req, res, next);
        }

    } catch (error) {
        next(error);
    }
};