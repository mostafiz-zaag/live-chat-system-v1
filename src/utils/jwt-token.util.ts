import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenUtil {
    constructor(private readonly jwtService: JwtService) {}

    generateToken(payload: any): string {
        return this.jwtService.sign(payload);
    }

    verifyToken(token: string): any {
        return this.jwtService.verify(token);
    }
}
