import { createObjectCsvWriter } from 'csv-writer';
import { Request, Response } from 'express';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { ApiResponse } from '../../../utils/ApiResponse';
import sendEmail from '../../../utils/emailSender';
import logger from '../../../utils/logger';
import userSessions from '../../../utils/userSeassion';
import { ClientData } from './scrapper.interface';

const timeout = 120000; // Increased timeout to 2 minutes for page actions


const userList = [
    {
        username: 'username1',
        pass: 'password1',
    },
    {
        username: 'username2',
        pass: 'password2',
    },
    {
        username: 'username3',
        pass: 'password3',
    },
];

const getUser = (index: number) => {
    return userList[(index - 1) % userList.length];
};



const saveDatatoEXL = async (
    clientIDs: string[],
    req: Request,
    totalDataCount: (data: number) => void,
    totalDataSavedCount: (data: number) => void,
): Promise<string | void> => {
    const csvFilePath = path.join(__dirname, '../../../../temp', `client_data_${new Date().getTime()}.csv`);

    console.time('Total processing time');
    const records: ClientData[] = [];

    const browsersCount = 5; // Number of browser instances to run in parallel
    const clientsPerBrowser = Math.ceil(clientIDs.length / browsersCount);
    logger.info(`Clients per browser instance: ${clientsPerBrowser}`);
    const totalClients = clientIDs.length;
    totalDataCount(totalClients);

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

    const browserPromises = [];
    for (let i = 0; i < browsersCount; i++) {
        const clientIDSubset = clientIDs.slice(i * clientsPerBrowser, (i + 1) * clientsPerBrowser);
        browserPromises.push(processBrowserInstance(clientIDSubset, req, records, totalDataSavedCount , i+1));
    }

    logger.info(`Total browsers: ${browserPromises.length}`);

    await Promise.all(browserPromises);

    // Retry logic for failed client IDs
    let retryCount = 0;
    if (records.length !== clientIDs.length ) {
        console.log(`Expected records: ${clientIDs.length}, Processed records: ${records.length}`);
        logger.warn(`Some records were not processed. Retrying... Attempt ${retryCount + 1}`);
        const failedClientIDs = clientIDs.filter(id => !records.some(record => record.clientID === id));
        const failedRecords: ClientData[] = [];
        logger.warn(`Failed records: ${failedClientIDs.length}`);
        const failedBrowserPromises = [];
        for (let i = 0; i < browsersCount; i++) {
            const clientIDSubset = failedClientIDs.slice(i * clientsPerBrowser, (i + 1) * clientsPerBrowser);
            failedBrowserPromises.push(processBrowserInstance(clientIDSubset, req, failedRecords, totalDataSavedCount, i+1));
        }
        await Promise.all(failedBrowserPromises);
        records.push(...failedRecords);
    }

    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await csvWriter.writeRecords(chunk);
    }

    console.log(`Expected records: ${clientIDs.length}, Processed records: ${records.length}`);
    if (records.length !== clientIDs.length) {
        console.warn('Some records were not processed. Please check the logs for details.');
    }

    console.timeEnd('Total processing time');
    logger.info('Data saved successfully!');

    return `${csvFilePath}`;
};

async function processBrowserInstance(clientIDSubset: string[], req: Request, records: ClientData[], totalDataSavedCount: (data: number) => void , browserCount : number){
    let browser: Browser | null = null;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        page.setDefaultTimeout(timeout);

        await page.goto("https://epaces.emedny.org");
        await page.type('#Username', (getUser(browserCount).username).toString());
        await page.type('#Password', (req.body.pass).toString());
        await page.click('#chkbxAgree');
        await page.click('#btnAgreeLogin');

        for (const id of clientIDSubset) {
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 3000;
            let success = false;
            
            

            while (!success && retryCount < maxRetries) {
                console.log(`Processing client ID: ${id}`);
            console.log(`Records length: ${records.length}`);

            // if data already exists in records, then skip
            if(records.some(record => record.clientID === id)) {
                logger.info(`${id} already exists. Skipping...`);
                success = true; // skip this client ID
                continue;
            }
                
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

                    if (clientData.clientID) {
                        // if data already exists, skip
                        if (records.some(record => record.clientID === clientData.clientID)) {
                            logger.info(`Data for client ID: ${id} already exists. Skipping... from this instance`);
                            continue;
                        }
                        records.push(clientData);
                    }
                    success = true;
                    totalDataSavedCount(records.length);
                    logger.info(`Data for client ID: ${id} processed successfully!`);
                } catch (error) {
                    logger.error(`Attempt ${retryCount + 1} failed for client ID: ${id}`, error);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }

            if (!success) {
                logger.error(`Failed to process client ID: ${id} after ${maxRetries} attempts`);
            }
        }
    } catch (error) {
        logger.error('Error occurred on page:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Get user ID from request
const getUserIdFromRequest = (req: Request): string => {
    return req.body.username;
};

// Launch browser
const launchBrowser = async (): Promise<Browser> => {
    console.log('Launching a new browser instance...');
    return puppeteer.launch({ headless: false, protocolTimeout: timeout });
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

// Handle save data EXL
const handleSaveDataEXL = async (req: Request, res: Response, increaseActiveInstances: Function, decreaseActiveInstances: Function) => {
    const userId = getUserIdFromRequest(req); // Get user ID from request
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, { message: 'User ID is required' }));
    }
    // logger.info(`Handling request for user: ${userId}`);
    try {
        const session = userSessions.get(userId);
        if (session) {
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

        userSessions.set(userId, {
            totalData: 0,
            totalDataSaved: 0,
        });
        increaseActiveInstances();

        const result = await saveDatatoEXL(
            req.body.clientID,
            req,
            (data) => totalDataCount(userId, data),
            (data) => totalDataSavedCount(userId, data),
        );

        if (result && !req.body.dataFileTrue) {
            sendEmail(result);
            closeBrowser(userId, decreaseActiveInstances);
        }

        if (result && req.body.dataFileTrue && req.body.dataFilePath) {
            console.log(result);
            console.log(req.body.dataFilePath);
            closeBrowser(userId, decreaseActiveInstances);
        }

        decreaseActiveInstances();
    } catch (error) {
        logger.error(error);
        closeBrowser(userId, decreaseActiveInstances);
        if (!res.headersSent) {
            res.status(500).json(new ApiResponse(500, { message: 'An error occurred while processing your request.' }));
        }
    }
};

// close browser
const closeBrowser = async (userId: string, decreaseActiveInstances: Function) => {
    const session = userSessions.get(userId);
    if (session) {
        userSessions.delete(userId);
        decreaseActiveInstances();
    }
};

export const scrapperService = {
    saveDatatoEXL,
    handleSaveDataEXL,
    getUserIdFromRequest,
    userSessions,
};
