import { SelectQueryBuilder } from 'typeorm';

export class DepartmentSpecification {
    static distinctFaqs<T>(
        queryBuilder: SelectQueryBuilder<T>,
    ): SelectQueryBuilder<T> {
        return queryBuilder.distinct(true);
    }

    static matchName<T>(
        queryBuilder: SelectQueryBuilder<T>,
        name: string,
    ): SelectQueryBuilder<T> {
        if (name) {
            return queryBuilder.andWhere('department.name LIKE :name', {
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
            return queryBuilder.andWhere('department.isActive = :status', {
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
            return queryBuilder.andWhere('department.id = :id', { id });
        }
        return queryBuilder;
    }
}
