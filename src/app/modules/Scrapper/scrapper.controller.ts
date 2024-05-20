import { Request, Response, NextFunction } from 'express';
import puppeteer, { Browser } from 'puppeteer';
import { ApiResponse } from '../../../utils/ApiResponse';
import sendEmail from '../../../utils/emailSender';
import { scrapperService } from './scrapper.service';
import logger from '../../../utils/logger';

interface UserSession {
    browser: Browser;
    totalData: number;
    totalDataSaved: number;
}

// User sessions
const userSessions: Map<string, UserSession> = new Map();

// Information about active instances
let activeInstances = 0;
const MAX_INSTANCES = 2;

// Launch browser
const launchBrowser = async (): Promise<Browser> => {
    console.log('Launching a new browser instance...');
    return await puppeteer.launch({ headless: false });
};

// Close browser
const closeBrowser = async (userId: string) => {
    console.log(`Closing browser for user: ${userId}`);
    const session = userSessions.get(userId);
    if (session) {
        await session.browser.close();
        userSessions.delete(userId);
        activeInstances--;
        console.log(`Active instances decreased. Current active instances: ${activeInstances}`);
    }
};

// Total data count
const totalDataCount = (userId: string, data: number) => {
    const session = userSessions.get(userId);
    if (session) {
        session.totalData = data;
    }
};

// Total data saved count
const totalDataSavedCount = (userId: string, data: number) => {
    const session = userSessions.get(userId);
    if (session) {
        session.totalDataSaved = data;
    }
};

// Get user ID from request
const getUserIdFromRequest = (req: Request): string => {
    return req.body.username
};

// Handle save data EXL
const handleSaveDataEXL = async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req); // Get user ID from request
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, { message: 'User ID is required' }));
    }
    logger.info(`Handling request for user: ${userId}`); 
    try {
        const session = userSessions.get(userId);
        if (session) {
            console.log(`Session already exists for user: ${userId}`);
            return res.status(202).json(new ApiResponse(202, {
                isSavingData: true,
                message: `Data saving is in progress. ${session.totalDataSaved} out of ${session.totalData} data saved.`,
            }));
        }

        res.status(202).json(new ApiResponse(202, {
            isSavingData: true,
            message: 'Data saving has started. You will receive an email once the process is complete',
        }));

        const browser = await launchBrowser();
        userSessions.set(userId, {
            browser,
            totalData: 0,
            totalDataSaved: 0,
        });
        activeInstances++;
        logger.info(`New browser instance launched. Current active instances: ${activeInstances}`);

        const result = await scrapperService.saveDataEXL(
            req.body.clientID,
            browser,
            (data) => totalDataCount(userId, data),
            (data) => totalDataSavedCount(userId, data),
        );

        if (result) {
            sendEmail(result);
        }

        await closeBrowser(userId);
    } catch (error) {
        logger.error(error);
        if (!res.headersSent) {
            res.status(500).json(new ApiResponse(500, { message: 'An error occurred while processing your request.' }));
        }
    }
};

export const saveDataEXL = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Received request for saveDataEXL');
    if (activeInstances >= MAX_INSTANCES) {
        const message = `${activeInstances} user${activeInstances > 1 ? 's' : ''} using this, please wait some time.`;
        logger.info(message);
        return res.status(202).json(new ApiResponse(202, { message }));
    }
    await handleSaveDataEXL(req, res);
};

export const closeAllBrowser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, { message: 'User ID is required' }));
    }
    console.log(`Received request to close browser for user: ${userId}`);
    try {
        await closeBrowser(userId);
        res.status(200).json(new ApiResponse(200, { message: 'Browser closed for the user' }));
    } catch (error) {
        next(error);
    }
};
