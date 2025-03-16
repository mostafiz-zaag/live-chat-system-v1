import * as dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
    SERVER_PORT: process.env.SERVER_PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    ADMIN_FULL_NAME: process.env.ADMIN_FULL_NAME,
    ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    SMTP_FROM_MAIL: process.env.SMTP_FROM_MAIL,
    COMPANY_NAME: process.env.COMPANY_NAME,
    COMPANY_ADDRESS: process.env.SERVER_PORT,
    SERVER_URL: process.env.SERVER_PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRED: process.env.JWT_EXPIRED,

    S3_PREFIX: process.env.SERVER_PORT,
    S3_ACCESS_KEY: process.env.SERVER_PORT,
    S3_SECRET_KEY: process.env.SERVER_PORT,
    S3_BUCKET_NAME: process.env.SERVER_PORT,
    REGION: process.env.SERVER_PORT,
    S3_URL: process.env.SERVER_PORT,
};
