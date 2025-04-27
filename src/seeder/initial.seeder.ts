import { Injectable, OnModuleInit } from '@nestjs/common';
import { CustomLoggerService } from '../logging/logger.service';
import * as process from 'node:process';
import { COMPANY_NAME } from '../constants/global.constant';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/user/entities/user.entity';
import { Role } from '../enums/user-role';
import { UserRepository } from '../modules/user/user.repository';
import { envConfig } from '../configs/env.config';
import { AuthenticatorService } from '../security/authenticator.service';

@Injectable()
export class InitialSeeder implements OnModuleInit {
    constructor(
        private readonly logger: CustomLoggerService,
        private readonly userRepository: UserRepository,
        private readonly authenticatorService: AuthenticatorService, // Replace with actual service
    ) {}

    async onModuleInit() {
        this.logger.log('Starting initial seeding...');
        try {
            await this.createAdmin();
            this.logger.log('Initial seeding completed.');
        } catch (error) {
            this.logger.error(error);
            process.exit(1);
        }
    }

    async createAdmin() {
        const username = envConfig.ADMIN_USERNAME;
        const password = envConfig.ADMIN_PASSWORD;

        const existingUser = await this.userRepository.findByUsername(username);

        if (existingUser) {
            this.logger.log('Admin user already exists. Skipping creation.');
        } else {
            const secret = this.authenticatorService.generateSecret(username);

            // Generate the QR Code URL using the secret
            const qrCodeUrl = `otpauth://totp/${username}?secret=${secret.base32}&issuer=${COMPANY_NAME}`;

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAdmin = new User();
            newAdmin.username = username;
            newAdmin.password = hashedPassword;
            newAdmin.role = Role.ADMIN;
            newAdmin.isTemporaryPassword = true;
            newAdmin.twoFASecret = secret.base32; // Save the 2FA secret
            newAdmin.isActive = true; // Set the user as active
            newAdmin.accountStatus = 'active'; // Set the account status to active

            // Save the user
            const savedAdmin = await this.userRepository.save(newAdmin);

            this.logger.log('Admin user created successfully.');

            // Return the created user and the QR code URL
            return {
                user: savedAdmin,
                qrCodeUrl, // Provide the QR code URL for the user to scan
                secret: secret.base32, // Secret to store temporarily
            };
        }
    }
}
