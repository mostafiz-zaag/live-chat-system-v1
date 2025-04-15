import { SelectQueryBuilder } from 'typeorm';
import { Role } from '../../enums/user-role';

export class UserSpecification {
    static distinctUsers<T>(
        queryBuilder: SelectQueryBuilder<T>,
    ): SelectQueryBuilder<T> {
        return queryBuilder.distinct(true);
    }

    static matchName<T>(
        queryBuilder: SelectQueryBuilder<T>,
        name: string,
    ): SelectQueryBuilder<T> {
        if (name) {
            return queryBuilder.andWhere('user.username LIKE :name', {
                name: `%${name}%`,
            });
        }
        return queryBuilder;
    }

    static matchStatus<T>(
        queryBuilder: SelectQueryBuilder<T>,
        status: boolean,
    ): SelectQueryBuilder<T> {
        if (status !== undefined && status !== null) {
            return queryBuilder.andWhere('user.isActive = :status', {
                status,
            });
        }
        return queryBuilder;
    }

    static matchId<T>(
        queryBuilder: SelectQueryBuilder<T>,
        id: number,
    ): SelectQueryBuilder<T> {
        if (id) {
            return queryBuilder.andWhere('user.id = :id', { id });
        }
        return queryBuilder;
    }

    static matchRole<T>(
        queryBuilder: SelectQueryBuilder<T>,
        role: Role,
    ): SelectQueryBuilder<T> {
        if (role) {
            return queryBuilder.andWhere('user.role = :role', { role });
        }
        return queryBuilder;
    }
}
