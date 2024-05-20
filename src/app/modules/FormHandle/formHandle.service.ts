import csvParser from 'csv-parser';
import fs from 'fs';

const processCSV = async (path: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const results: string[] = [];
        fs.createReadStream(path)
            .pipe(csvParser({ headers: false }))
            .on('data', (data) => {
                const value = Object.values(data)[0] as string;
                if (value) {
                    results.push(value);
                }
            })
            .on('end', () => {
                fs.unlinkSync(path);
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

export const formHandleService = { processCSV };
