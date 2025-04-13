import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import {
    HEADER_STRING,
    JWT_SECRET,
    TOKEN_PREFIX,
} from '../constants/jwt.constants';
import { InvalidAuthenticationException } from '../exceptions';
import { CustomLoggerService } from '../logging/logger.service';
import { CustomPrincipal } from '../payloads/custom.principle';
import { LiteCustomPrincipal } from '../payloads/lite-custom.principle';

@Injectable()
export class SecurityUtil {
    private static currentRequest: Request;

    constructor(
        private readonly jwtService: JwtService,
        private readonly logger: CustomLoggerService,
    ) {}

    public static setCurrentRequest(request: Request) {
        this.currentRequest = request;
    }

    // Encrypt Password
    async encryptPassword(password: string): Promise<string> {
        return await bcrypt.hashSync(password, 10);
    }

    // Match Password
    async matchPassword(
        originalPassword: string,
        encryptedPassword: string,
    ): Promise<boolean> {
        return await bcrypt.compareSync(originalPassword, encryptedPassword);
    }

    // Extract token from request headers
    async getTokenFromRequestHeader(): Promise<string> {
        const authorizationHeader = SecurityUtil.currentRequest.headers[
            HEADER_STRING.toLowerCase()
        ] as string;
        if (
            authorizationHeader &&
            authorizationHeader.startsWith(TOKEN_PREFIX)
        ) {
            return authorizationHeader.slice(TOKEN_PREFIX.length).trim();
        }
        throw new InvalidAuthenticationException(
            'Invalid Authorization Header',
        );
    }

    // Get logged-in user ID
    async getLoggedInUserId(): Promise<number> {
        const principal: CustomPrincipal = await this.getLoggedInUser();
        return principal?.userId || 0;
    }

    // Get logged-in user details
    async getLoggedInUser(): Promise<CustomPrincipal> {
        const token = await this.getTokenFromRequestHeader();
        const decoded = await this.jwtService.verify(token, {
            secret: JWT_SECRET,
        }); // Verify and decode the token using  jwtService`

        console.log('Decoded token:', decoded);
        return new CustomPrincipal(
            decoded.CURRENT_USER.userId, // userId
            decoded.sub, // username
            decoded.CURRENT_USER.roleAliases, // roleAliases (you can add more if needed)
            decoded.CURRENT_USER.active, // active (set to true as an example, can be changed based on your logic)
        );
    }

    // Get LiteCustomPrincipal (for error handling or logging)
    async getLiteCustomPrincipalForError(): Promise<LiteCustomPrincipal | null> {
        try {
            const principal: CustomPrincipal = await this.getLoggedInUser();
            return principal.liteUser();
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Get the current user details from token
    async getTokenHolderDetails(token: string): Promise<CustomPrincipal> {
        const claims = await this.getClaims(token);
        return claims.CURRENT_USER as CustomPrincipal;
    }

    // Get claims from token
    private getClaims(token: string): any {
        try {
            return this.jwtService.verify(token); // Static jwtService
        } catch (error) {
            this.logger.error(error);
            throw new InvalidAuthenticationException('Invalid Token');
        }
    }
}
