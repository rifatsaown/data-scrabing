import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../../../utils/ApiResponse';
import sendEmail from '../../../utils/emailSender';
import { scrapperService } from './scrapper.service';

// Function to save data for multiple client IDs
let isCollectingData = false ;

export const saveDataEXL = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if(isCollectingData) return res.status(202).json(new ApiResponse(202, { isSavingData: true, message: "Data saving is already in progress. Please wait for the process to complete" })); // Send a response to the client
        
        // If data is not being saved, set the flag to true 
        res.status(202).json(new ApiResponse(202, {
            isSavingData: true,
            message: "Data saving has started. You will receive an email once the process is complete"
        })); // Send a response to the client
        isCollectingData = true; // Set the flag to true
        const browser = await scrapperService.launchBrowser(); // Launch a new browser
        const result = await scrapperService.saveDataEXL(req.body.clientID,browser); // Call the service function to save data
        sendEmail(result); // Send an email with the result
        isCollectingData = false; // Set the flag to false
    } catch (error) {
        // If an error occurs during the execution of the function, send an error response
        next(error);
    }
}