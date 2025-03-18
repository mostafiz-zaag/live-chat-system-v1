import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityUtil {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async verifyPassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        console.log('verify password ---------------------------------');
        console.log(' 1 : ', plainPassword);
        console.log(' 2 : ', hashedPassword);
        const result = await bcrypt.compare(plainPassword, hashedPassword);
        console.log('✅ Password Match Result:', result);
        return result;
    }
}
