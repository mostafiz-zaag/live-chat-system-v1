import { Injectable } from '@nestjs/common';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { SecurityUtil } from '../../utils/security.util';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenUtil: JwtTokenUtil,
        private readonly securityUtil: SecurityUtil,
    ) {}

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findByEmail(email);
        if (
            user &&
            (await this.securityUtil.verifyPassword(password, user.password))
        ) {
            return user;
        }
        return null;
    }

    async login(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtTokenUtil.generateToken(payload),
        };
    }
}
