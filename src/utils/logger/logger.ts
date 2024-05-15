import winston from "winston";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${level}] ${timestamp}  ${message}`;
});

const productionLogger = () => {
    return winston.createLogger({
        format: winston.format.combine(
            winston.format.json(),
            winston.format.timestamp(),
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/info.log', level: 'info' }),
            new winston.transports.File({ filename: 'logs/warn.log', level: 'warn' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
    });
};

const developmentLogger = () => {
    return winston.createLogger({
        format: winston.format.combine(
            winston.format.colorize({ all: true}),
            winston.format.timestamp({ format: 'HH:mm:ss'}),
            myFormat,
        ),
        transports: [
            new winston.transports.Console(),
        ],
    });
};

export { developmentLogger, productionLogger };

