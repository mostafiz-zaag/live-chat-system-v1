import { Injectable } from '@nestjs/common';
import { Role } from 'src/enums/user-role';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Faq } from './faq.entity';

@Injectable()
export class FaqRepository extends Repository<Faq> {
    constructor(private readonly dataSource: DataSource) {
        super(Faq, dataSource.createEntityManager());
    }

    async createFAQ(
        sentence: string,
        role: Role,
        userId: number,
    ): Promise<Faq> {
        const userRepo = this.dataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId });

        const faq = this.create({
            sentence,
            role,
            createdBy: user ?? null,
        });

        return await this.save(faq);
    }
}
