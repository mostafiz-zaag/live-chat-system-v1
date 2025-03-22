import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenUtil {
    constructor(private readonly jwtService: JwtService) {}

    generateToken(user: any): string {
        // Construct a plain object as the payload
        const payload = {
            sub: user.id, // User ID (subject)
            username: user.username, // User's username
            role: user.role, // User's role
            // Add any other necessary fields here
        };

        return this.jwtService.sign(payload); // Generate and return JWT token
    }

    verifyToken(token: string): any {
        return this.jwtService.verify(token);
    }
}
