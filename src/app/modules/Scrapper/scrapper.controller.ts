import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { ApiResponse } from '../../../utils/ApiResponse';
import logger from '../../../utils/logger';
import userSessions from '../../../utils/userSeassion';
import { scrapperService } from './scrapper.service';



// Information about active instances
let activeInstances = 0;
const MAX_INSTANCES = 2;

//increase active instances
const increaseActiveInstances = () => {
    activeInstances++;
    console.log(`Active instances increased. Current active instances: ${activeInstances}`);
};

// decrease active instances
const decreaseActiveInstances = () => {
    activeInstances--;
    console.log(`Active instances decreased. Current active instances: ${activeInstances}`);
};


export const saveDataEXL = async (req: Request, res: Response, next: NextFunction) => {
    // Get user ID from the request
    const userId = scrapperService.getUserIdFromRequest(req);
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, { message: 'User ID is required' }));
    }
    // Check if the user is already using the service
    if (userSessions.has(userId)) {
        const datafile = req.body?.dataFilePath;
        if (datafile) {
            fs.unlinkSync(datafile);
        }
        return await scrapperService.handleSaveDataEXL(req, res, increaseActiveInstances, decreaseActiveInstances);
    }
    // Check if the maximum number of instances is reached
    if (activeInstances >= MAX_INSTANCES) {
        const message = `${activeInstances} user${activeInstances > 1 ? 's' : ''} using this, please wait some time.`;
        logger.info(message);
        return res.status(202).json(new ApiResponse(202, { message }));
    }
    // Create a new user session
    await scrapperService.handleSaveDataEXL(req, res, increaseActiveInstances, decreaseActiveInstances);
};

export const closeAllBrowser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = scrapperService.getUserIdFromRequest(req);
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, { message: 'User ID is required' }));
    }
    console.log(`Received request to close browser for user: ${userId}`);
    try {
        await scrapperService.closeBrowser(userId , decreaseActiveInstances);
        res.status(200).json(new ApiResponse(200, { message: 'Browser closed for the user' }));
    } catch (error) {
        next(error);
    }
};
