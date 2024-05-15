import { Logger } from "winston";
import { developmentLogger, productionLogger } from "./logger";

let logger: Logger = {} as Logger;

if (process.env.NODE_ENV === 'development') {
    logger = developmentLogger();
}
if (process.env.NODE_ENV === 'production') {
    logger = productionLogger();
}

export default logger;

