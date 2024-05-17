import { NextFunction, Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { ApiResponse } from '../../../utils/ApiResponse';
import sendEmail from '../../../utils/emailSender';
import { scrapperService } from './scrapper.service';

// Function to save data for multiple client IDs
let isCollectingData = false ;

let totalData = 0;
let totalDataSaved = 0;
let browserData: any; // Declare a variable to store the browser instance

const totalDataCount = (data:number) => {
    totalData = data;
}
const totalDataSavedCount = (data:number) => {
    totalDataSaved = data;
}
const launchBrowser = async (): Promise<any> => {
    return await puppeteer.launch({ headless: false });;
};

const closeBrowser = async (browser: any) => {
    await browser.close();
}


export const saveDataEXL = async (req: Request, res: Response, next: NextFunction) => {

    try {
        if(isCollectingData) return res.status(202).json(new ApiResponse(202, 
            { 
                isSavingData: true, 
                message: `Data saving is in progress. ${totalDataSaved} out of ${totalData} data saved.` 
            })); // Send a response to the client
        
        // If data is not being saved, set the flag to true 
        res.status(202).json(new ApiResponse(202, {
            isSavingData: true,
            message: 'Data saving has started. You will receive an email once the process is complete'
        })); // Send a response to the client
        isCollectingData = true; // Set the flag to true
        const browser = await launchBrowser(); // Launch a new browser
        browserData = browser;
        const result = await scrapperService.saveDataEXL(req.body.clientID,browser , totalDataCount, totalDataSavedCount); // Call the service function to save data
        if (result) {
            sendEmail(result); // Send an email with the file link
        } 
        isCollectingData = false; // Set the flag to false


    } catch (error) {
        // If an error occurs during the execution of the function, send an error response
        next(error);
    }
}

export const closeAllBrowser = async (req: Request, res: Response, next: NextFunction) => {
    if(!browserData) return res.status(202).json(new ApiResponse(202, { message: 'No browser instance found' }));
    try {
        await closeBrowser(browserData);
        res.status(200).json(new ApiResponse(200, { message: 'All browser closed' }));
    } catch (error) {
        next(error);
    }
}