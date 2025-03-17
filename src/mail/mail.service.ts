import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { mailConfig } from './mail.config';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        console.log('Mail Config:', mailConfig); // Debugging: Log mail config

        this.transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: false, // `false` for STARTTLS
            auth: {
                user: mailConfig.auth.user,
                pass: mailConfig.auth.pass,
            },
            tls: {
                ciphers: 'TLSv1.2', // Ensure TLS is used
                rejectUnauthorized: false, // Allow self-signed certificates
            },
        });
    }

    async sendRegistrationEmail(
        email: string,
        role: string,
        temporaryPassword: string,
    ) {
        try {
            console.log('Sending email to:', email); // Debugging log

            const subject = `Your ${role} account has been created`;

            // Define login URL (update with your actual frontend URL)
            const loginUrl = `https://yourfrontend.com/login`;

            const message = `
                <h3>Welcome to our live chat system!</h3>
                <p>Your ${role} account has been successfully created.</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p>Please <a href="${loginUrl}">click here to login</a> and change your password.</p>
            `;

            const response = await this.transporter.sendMail({
                from: `"Support Team" <${mailConfig.auth.user}>`,
                to: email,
                subject: subject,
                html: message,
            });

            console.log('Email sent successfully:', response);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email.');
        }
    }
    async sendOtpEmail(email: string, otp: string) {
        try {
            console.log('Sending OTP to:', email);

            const subject = 'Your OTP Code for Login';
            const message = `
                <h3>OTP Verification</h3>
                <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
                <p>This OTP is valid for 5 minutes.</p>
            `;

            await this.transporter.sendMail({
                from: `"Support Team" <${mailConfig.auth.user}>`,
                to: email,
                subject: subject,
                html: message,
            });

            console.log('OTP email sent successfully.');
        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw new Error('Failed to send OTP email.');
        }
    }
}
