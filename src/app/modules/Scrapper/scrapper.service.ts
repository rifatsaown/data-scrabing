import ExcelJS from 'exceljs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import logger from '../../../utils/logger';
import ClientData from './scrapper.interface';


const launchBrowser = async (): Promise<any> => {
    const browser = await puppeteer.launch({ headless: false });
    return browser;
};

// Function to grab data for multiple client IDs
const saveDataEXL = async (clientIDs: string[] , browser : Browser , totalDataCount:Function, totalDataSavedCount:Function): Promise<string | void> => {
    // Start a timer
    console.time('Total processing time');
    
    // Create a new page in the browser
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // Set viewport size

    // Define retry settings
    const maxRetries: number = 1;
    const retryDelay: number = 3000; // 3 seconds

    try {
        // Navigate to the login page
        await page.goto(process.env.SITE_URL!);
        await page.type('#Username', process.env.SITE_USERNAME!); // Type username
        await page.type('#Password', process.env.SITE_PASSWORD!); // Type password
        await page.click('#chkbxAgree'); // Click on agree checkbox
        await page.click('#btnAgreeLogin'); // Click on login button

        // Create a new Excel workbook and worksheet
        const workbook: ExcelJS.Workbook = new ExcelJS.Workbook();
        const worksheet: ExcelJS.Worksheet = workbook.addWorksheet('Data');

        totalDataCount(clientIDs.length);
        // Iterate over each client ID
        for (let index = 0; index < clientIDs.length; index++) {
            const id: string = clientIDs[index];
            logger.info(`Processing client ID: ${id}`);
            // Start measuring time
            console.time(`Processing time for client ID: ${id}`);

            let retryCount: number = 0;
            let success: boolean = false;

            while (!success && retryCount < maxRetries) {
                try {
                    // Navigate to the request page
                    const requestPageSelector: string = "#ctl00_Menu1_linkEligibilityRequest";
                    await page.waitForSelector(requestPageSelector);
                    await page.click(requestPageSelector);

                    // Fill out the form and submit
                    const clientIDSelector: string = "#ctl00_ContentPlaceHolder1_textBoxClientID";
                    await page.waitForSelector(clientIDSelector);
                    await page.type(clientIDSelector, id);
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_buttonSubmit');
                    await page.click('#ctl00_ContentPlaceHolder1_buttonSubmit');
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_lblSummary');

                    // Navigate to the response page
                    await page.click('#ctl00_Menu1_linkEligibilityResponse');
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_RadGrid1_ctl00__0');
                    await page.click('#ctl00_ContentPlaceHolder1_RadGrid1_ctl00__0 a');

                    // Wait for response page to load
                    await page.waitForSelector('td.pageTitle');
                    const clientData: ClientData = await page.evaluate(() => {
                      // Get the client information from the page
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
                        clientPlanDate: (document.querySelector('#ctl00_ContentPlaceHolder1_labelPlanDate') as HTMLElement)?.innerText
                      };
                    });

                    // Add headers to the worksheet
                    if (index === 0) {
                        worksheet.getRow(1).font = { bold: true };
                        const header: string[] = ['Client ID', 'Client Name', 'Gender', 'SSN', 'Date of Birth', 'Anniversary Date', 'Recertification', 'Address 1', 'Address 2', 'City, State Zip', 'County', 'Office', 'Date of Service', 'Plan Date'];
                        worksheet.columns = header.map((key) => {
                            return { header: key, key, width: 20 };
                        });
                    }

                    // Add data to the worksheet
                    const worksheetRow = worksheet.getRow(index + 2); // index + 2 because the first row is the header
                    worksheetRow.getCell('Client ID').value = clientData.clientID;
                    worksheetRow.getCell('Client Name').value = clientData.clientName;
                    worksheetRow.getCell('Gender').value = clientData.clientGender;
                    worksheetRow.getCell('SSN').value = clientData.clientSSN;
                    worksheetRow.getCell('Date of Birth').value = clientData.clientDOB;
                    worksheetRow.getCell('Anniversary Date').value = clientData.clientAnniversaryDate;
                    worksheetRow.getCell('Recertification').value = clientData.clientRecertification;
                    worksheetRow.getCell('Address 1').value = clientData.clientAddress1;
                    worksheetRow.getCell('Address 2').value = clientData.clientAddress2;
                    worksheetRow.getCell('City, State Zip').value = clientData.clientCityStateZip;
                    worksheetRow.getCell('County').value = clientData.clientCounty;
                    worksheetRow.getCell('Office').value = clientData.clientOffice;
                    worksheetRow.getCell('Date of Service').value = clientData.clientDateOfService;
                    worksheetRow.getCell('Plan Date').value = clientData.clientPlanDate;
                    success = true;

                    logger.info(`Data for client ID: ${id} processed successfully!`);
                    logger.info(index +1 + " of " + clientIDs.length + " completed"); 
                    
    
                    // Stop measuring time
                    console.timeEnd(`Processing time for client ID: ${id}`);
                    totalDataSavedCount(index + 1);
                } catch (error) {
                    logger.error(`Attempt ${retryCount + 1} failed:`, error);
                    retryCount++;
                    logger.info(`Retrying (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay)); // Wait before retrying
                }
            }
    
            if (!success) {
                logger.info(`Maximum retry attempts reached for client ID: ${id}. Skipping...`);
            }
        };
    
        // Save the workbook to a file to download folder in the root directory of the project
        const filePath: string = path.join(__dirname, '../../../../temp', 'client_data.xlsx');
        await workbook.xlsx.writeFile(filePath);

        logger.info("Data saved successfully!");
    
        // Stop measuring total time
        console.timeEnd('Total processing time');
        // Close the browser
        await browser.close();

        return `${filePath}`;
    } catch (error) {
        // Handle errors
        logger.error('Error occurred:', error);
        await browser.close();
    }
}

// Export the function
export const scrapperService = { saveDataEXL ,launchBrowser};

