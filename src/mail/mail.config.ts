import { envConfig } from 'src/configs/env.config';

export const mailConfig = {
    host: envConfig.SMTP_HOST_FOR_MAIL,
    port: Number(envConfig.SMTP_PORT_FOR_MAIL) || 587, // Convert to number
    secure: false, // Use `false` for Office365 (TLS)
    auth: {
        user: envConfig.SMTP_USER_FOR_MAIL,
        pass: envConfig.SMTP_PASSWORD_FOR_MAIL,
    },
};
