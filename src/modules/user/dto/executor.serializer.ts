import { User } from '../entities/user.entity';

export class ExecutorSerializer {
    static serialize(user: User) {
        if (user) {
            return {
                username: user.username,
                email: user.email,
            };
        } else {
            return user;
        }
    }
}
