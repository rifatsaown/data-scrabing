import { createObjectCsvWriter } from 'csv-writer';
import { Request, Response } from 'express';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { ApiResponse } from '../../../utils/ApiResponse';
import sendEmail from '../../../utils/emailSender';
import logger from '../../../utils/logger';
import userSessions from '../../../utils/userSeassion';
import { ClientData } from './scrapper.interface';



const saveDatatoEXL = async (
    clientIDs: string[],
    req: Request,
    browser: Browser,
    totalDataCount: (data: number) => void,
    totalDataSavedCount: (data: number) => void,
): Promise<string | void> => {
    if (!browser.isConnected()) return;

    console.time('Total processing time');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const maxRetries = 1;
    const retryDelay = 3000;
    const csvFilePath = path.join(__dirname, '../../../../temp', `client_data_${new Date().getTime()}.csv`);
    

    // Initialize the CSV writer
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'clientID', title: 'Client ID' },
            { id: 'clientName', title: 'Client Name' },
            { id: 'clientGender', title: 'Gender' },
            { id: 'clientSSN', title: 'SSN' },
            { id: 'clientDOB', title: 'Date of Birth' },
            { id: 'clientAnniversaryDate', title: 'Anniversary Date' },
            { id: 'clientRecertification', title: 'Recertification' },
            { id: 'clientAddress1', title: 'Address 1' },
            { id: 'clientAddress2', title: 'Address 2' },
            { id: 'clientCityStateZip', title: 'City, State Zip' },
            { id: 'clientCounty', title: 'County' },
            { id: 'clientOffice', title: 'Office' },
            { id: 'clientDateOfService', title: 'Date of Service' },
            { id: 'clientPlanDate', title: 'Plan Date' },
        ]
    });

    try {
        await page.goto(process.env.SITE_URL!);
        await page.type('#Username', (req.body.username).toString());
        await page.type('#Password', (req.body.pass).toString());
        await page.click('#chkbxAgree');
        await page.click('#btnAgreeLogin');

        totalDataCount(clientIDs.length);

        const records: ClientData[] = [];

        for (let index = 0; index < clientIDs.length; index++) {
            if (!browser.isConnected()) return;

            const id = clientIDs[index];
            logger.info(`Processing client ID: ${id}`);
            console.time(`Processing time for client ID: ${id}`);

            let retryCount = 0;
            let success = false;

            while (!success && retryCount < maxRetries) {
                if (!browser.isConnected()) return;

                try {
                    await page.waitForSelector('#ctl00_Menu1_linkEligibilityRequest');
                    await page.click('#ctl00_Menu1_linkEligibilityRequest');

                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_textBoxClientID');
                    await page.type('#ctl00_ContentPlaceHolder1_textBoxClientID', id);
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_buttonSubmit');
                    await page.click('#ctl00_ContentPlaceHolder1_buttonSubmit');
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_lblSummary');

                    await page.click('#ctl00_Menu1_linkEligibilityResponse');
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_RadGrid1_ctl00__0');
                    await page.click('#ctl00_ContentPlaceHolder1_RadGrid1_ctl00__0 a');

                    await page.waitForSelector('td.pageTitle');
                    const clientData: ClientData = await page.evaluate(() => {
                        return {
                            clientID: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientID') as HTMLElement)?.innerText,
                            clientName: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientName') as HTMLElement)?.innerText,
                            clientGender: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientGender') as HTMLElement)?.innerText,
                            clientSSN: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientSSN') as HTMLElement)?.innerText,
                            clientDOB: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientDOB') as HTMLElement)?.innerText,
                            clientAnniversaryDate: (document.querySelector('#ctl00_ContentPlaceHolder1_labelAnniversary') as HTMLElement)?.innerText,
                            clientRecertification: (document.querySelector('#ctl00_ContentPlaceHolder1_labelRecertification') as HTMLElement)?.innerText,
                            clientAddress1: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientAddress1') as HTMLElement)?.innerText,
                            clientAddress2: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientAddress2') as HTMLElement)?.innerText,
                            clientCityStateZip: (document.querySelector('#ctl00_ContentPlaceHolder1_labelClientCityStateZip') as HTMLElement)?.innerText,
                            clientCounty: (document.querySelector('#ctl00_ContentPlaceHolder1_labelCounty') as HTMLElement)?.innerText,
                            clientOffice: (document.querySelector('#ctl00_ContentPlaceHolder1_labelOffice') as HTMLElement)?.innerText,
                            clientDateOfService: (document.querySelector('#ctl00_ContentPlaceHolder1_labelDateOfService') as HTMLElement)?.innerText,
                            clientPlanDate: (document.querySelector('#ctl00_ContentPlaceHolder1_labelPlanDate') as HTMLElement)?.innerText,
                        };
                    });

                    records.push(clientData);
                    success = true;

                    logger.info(`Data for client ID: ${id} processed successfully!`);
                    console.timeEnd(`Processing time for client ID: ${id}`);
                    totalDataSavedCount(index + 1);
                } catch (error) {
                    logger.error(`Attempt ${retryCount + 1} failed:`, error);
                    retryCount++;
                    logger.info(`Retrying (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }

            if (!success) {
                logger.info(`Maximum retry attempts reached for client ID: ${id}. Skipping...`);
            }
        }

        // Write the records to the CSV file
        await csvWriter.writeRecords(records);

        logger.info('Data saved successfully!');
        console.timeEnd('Total processing time');
        await browser.close();

        return `${csvFilePath}`;
    } catch (error) {
        logger.error('Error occurred:', error);
        await browser.close();
    }
};


// Get user ID from request
const getUserIdFromRequest = (req: Request): string => {
    return req.body.username
};


// Launch browser
const launchBrowser = async (): Promise<Browser> => {
    console.log('Launching a new browser instance...');
    return await puppeteer.launch({ headless: false });
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

// Close browser
const closeBrowser = async (userId: string, decreaseActiveInstances:Function ) => {
    console.log(`Closing browser for user: ${userId}`);
    const session = scrapperService.userSessions.get(userId);
    if (session) {
        await session.browser.close();
        scrapperService.userSessions.delete(userId);
        decreaseActiveInstances();
    }
};

// Handle save data EXL
const handleSaveDataEXL = async (req: Request, res: Response , increaseActiveInstances:Function,decreaseActiveInstances:Function ) => {  
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
        const clientIDs = req.body.clientID;
        if (!clientIDs || clientIDs.length === 0) {
            return res.status(400).json(new ApiResponse(400, { message: 'Client ID and Password are required' }));
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
        increaseActiveInstances();

        const result = await saveDatatoEXL(
            req.body.clientID,
            req,
            browser,
            (data) => totalDataCount(userId, data),
            (data) => totalDataSavedCount(userId, data),
        );

        if (result && !req.body.dataFileTrue) {
            sendEmail(result);
        }

        if(result && req.body.dataFileTrue && req.body.dataFilePath){
            console.log(result);
            console.log(req.body.dataFilePath);
        }

        await closeBrowser(userId , decreaseActiveInstances);
    } catch (error) {
        logger.error(error);
        if (!res.headersSent) {
            res.status(500).json(new ApiResponse(500, { message: 'An error occurred while processing your request.' }));
        }
    }
};

export const scrapperService = { 
    saveDatatoEXL,
    handleSaveDataEXL,
    getUserIdFromRequest,
    userSessions,
    launchBrowser,
    closeBrowser,
 };