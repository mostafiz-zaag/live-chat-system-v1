import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envConfig } from 'src/configs/env.config';
import { UserRepository } from '../../user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userRepository: UserRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: envConfig.JWT_SECRET || 'your-secret-key',
        });
    }

    async validate(payload: any) {
        const user = await this.userRepository.findById(payload.sub);
        if (user === undefined || user === null)
            throw new UnauthorizedException();
        return user;
    }
}
