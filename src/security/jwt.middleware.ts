import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SecurityUtil } from '../utils/security.util';
import { InvalidAuthenticationException } from '../exceptions';
import { CustomPrincipal } from '../payloads/custom.principle';
import { JwtTokenUtil } from '../utils/jwt-token.util';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        private readonly securityUtil: SecurityUtil,
        private readonly jwtTokenUtil: JwtTokenUtil,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            // Get the token from request headers
            const token: string =
                await this.securityUtil.getTokenFromRequestHeader();

            // Validate the token
            if (!token || !(await this.jwtTokenUtil.isValidToken(token))) {
                return next(
                    new InvalidAuthenticationException(
                        'Please Provide a valid token',
                    ),
                ); // Use next() to pass the error
            }

            // Validate and extract the principal from the token payload
            // Attach the user to the request object
            const customPrinciple =
                await this.jwtTokenUtil.getTokenHolderDetails(token);
            (req as any).user = customPrinciple;

            if (!req.originalUrl.includes('auth')) {
                if (!customPrinciple.active) {
                    return next(
                        new InvalidAuthenticationException(
                            'Provided token account is not active please contact with system admin',
                        ),
                    );
                }
            }
            next();
        } catch (error) {
            // Handle exceptions appropriately
            return next(error); // Pass the error to the next middleware
        }
    }

    // Validate the JWT payload and return the CustomPrincipal
    async validate(payload: any): Promise<CustomPrincipal> {
        const principal =
            await this.jwtTokenUtil.getTokenHolderDetails(payload); // Use getTokenHolderDetails from JwtTokenUtil
        if (!principal) {
            throw new InvalidAuthenticationException(
                'Unauthorized error occurred',
            );
        }
        return principal; // Return the validated CustomPrincipal
    }
}
