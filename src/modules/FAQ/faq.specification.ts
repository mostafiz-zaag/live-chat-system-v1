import { Role } from 'src/enums/user-role';
import { SelectQueryBuilder } from 'typeorm';

export class FAQSpecification {
    static distinctFaqs<T>(
        queryBuilder: SelectQueryBuilder<T>,
    ): SelectQueryBuilder<T> {
        return queryBuilder.distinct(true);
    }

    static matchSentence<T>(
        queryBuilder: SelectQueryBuilder<T>,
        sentence: string,
    ): SelectQueryBuilder<T> {
        if (sentence) {
            return queryBuilder.andWhere('faq.sentence ILIKE :sentence', {
                sentence: `%${sentence}%`,
            });
        }
        return queryBuilder;
    }

    static matchStatus<T>(
        queryBuilder: SelectQueryBuilder<T>,
        status: boolean,
    ): SelectQueryBuilder<T> {
        if (status !== undefined && status !== null) {
            return queryBuilder.andWhere('faq.isActive = :status', { status });
        }
        return queryBuilder;
    }

    static matchRole<T>(
        queryBuilder: SelectQueryBuilder<T>,
        role: Role,
    ): SelectQueryBuilder<T> {
        if (role) {
            return queryBuilder.andWhere('createdBy.role = :role', { role });
        }
        return queryBuilder;
    }

    static matchSelf<T>(
        queryBuilder: SelectQueryBuilder<T>,
        userId: number,
    ): SelectQueryBuilder<T> {
        if (userId) {
            return queryBuilder.andWhere('faq.createdBy.id = :userId', {
                userId,
            });
        }
        return queryBuilder;
    }

    static matchAdminOrSelf<T>(
        queryBuilder: SelectQueryBuilder<T>,
        userId: number,
    ): SelectQueryBuilder<T> {
        if (userId) {
            return queryBuilder.andWhere(
                '(createdBy.role = :adminRole OR createdBy.id = :userId)',
                {
                    adminRole: Role.ADMIN,
                    userId: userId,
                },
            );
        }
        return queryBuilder;
    }
}
