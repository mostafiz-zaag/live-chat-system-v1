import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    EXPIRATION_TIME,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRATION_TIME,
} from '../constants/jwt.constants';
import { PROJECT_NAME } from '../constants/project.constant';
import { InvalidAuthenticationException } from '../exceptions';
import { CustomLoggerService } from '../logging/logger.service';
import { CustomPrincipal } from '../payloads/custom.principle';

@Injectable()
export class JwtTokenUtil {
    constructor(
        private jwtService: JwtService,
        private readonly logger: CustomLoggerService,
    ) {}

    // Generate Access and Refresh Tokens
    async generateToken(
        principal: CustomPrincipal,
    ): Promise<{ access: string; refresh: string }> {
        const issuedAt = Math.floor(Date.now() / 1000); // Get current time in seconds

        const accessTokenExpiresIn = EXPIRATION_TIME;
        const refreshTokenExpiresIn = REFRESH_TOKEN_EXPIRATION_TIME;
        console.log('principal', principal);

        const accessToken = await this.jwtService.signAsync(
            {
                CURRENT_USER: principal,
                sub: principal.username,
                issuedAt: issuedAt,
            }, // Add iat here
            {
                secret: JWT_SECRET,
                expiresIn: accessTokenExpiresIn,
                issuer: PROJECT_NAME,
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            { sub: principal.username, issuedAt: issuedAt }, // Add iat here as well
            {
                secret: JWT_SECRET,
                expiresIn: refreshTokenExpiresIn,
            },
        );

        return { access: accessToken, refresh: refreshToken };
    }

    // Validate if the token is valid
    async isValidToken(token: string): Promise<boolean> {
        try {
            return !(!token || (await this.isTokenExpired(token)));
        } catch (error) {
            this.logger.error(error);
            return false;
        }
    }

    // Check if token is expired
    async isTokenExpired(token: string): Promise<boolean> {
        const expirationDate = await this.getExpirationDate(token);
        return expirationDate.getTime() < new Date().getTime();
    }

    // Parse token claims
    async getClaims(token: string): Promise<any> {
        try {
            return await this.jwtService.verify(token, { secret: JWT_SECRET });
        } catch (error) {
            this.logger.error(error);
            throw new InvalidAuthenticationException();
        }
    }

    // Get token expiration date
    async getExpirationDate(token: string): Promise<Date> {
        const claims = await this.getClaims(token);
        return new Date(claims.exp * 1000);
    }

    // Get the current user details from token
    async getTokenHolderDetails(token: string): Promise<CustomPrincipal> {
        const claims = await this.getClaims(token);
        return claims.CURRENT_USER as CustomPrincipal;
    }
}
