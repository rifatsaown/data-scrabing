import ExcelJS from 'exceljs';
import path from 'path';
import { Browser } from 'puppeteer';
import logger from '../../../utils/logger';
import ClientData from './scrapper.interface';

const saveDataEXL = async (
    clientIDs: string[],
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

    try {
        await page.goto(process.env.SITE_URL!);
        await page.type('#Username', process.env.SITE_USERNAME!);
        await page.type('#Password', process.env.SITE_PASSWORD!);
        await page.click('#chkbxAgree');
        await page.click('#btnAgreeLogin');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        totalDataCount(clientIDs.length);

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

                    if (index === 0) {
                        worksheet.getRow(1).font = { bold: true };
                        const header = ['Client ID', 'Client Name', 'Gender', 'SSN', 'Date of Birth', 'Anniversary Date', 'Recertification', 'Address 1', 'Address 2', 'City, State Zip', 'County', 'Office', 'Date of Service', 'Plan Date'];
                        worksheet.columns = header.map((key) => ({ header: key, key, width: 20 }));
                    }

                    const worksheetRow = worksheet.getRow(index + 2);
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

        const filePath = path.join(__dirname, '../../../../temp', `client_data_${new Date().getTime()}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        logger.info('Data saved successfully!');
        console.timeEnd('Total processing time');
        await browser.close();

        return `${filePath}`;
    } catch (error) {
        logger.error('Error occurred:', error);
        await browser.close();
    }
};

export const scrapperService = { saveDataEXL };