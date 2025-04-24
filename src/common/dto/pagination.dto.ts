interface PageRequest {
    page: number;
    size: number;
}

export interface PaginatedResponseDto<T> {
    content: T[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: {
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        pageNumber: number;
        pageSize: number;
        offset: number;
    };
    size: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    totalElements: number;
    totalPages: number;
}

export function createPaginatedResponse<T>(items: T[], total: number, pageRequest: PageRequest): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / pageRequest.size);

    return {
        content: items,
        empty: items.length === 0,
        first: pageRequest.page === 0,
        last: pageRequest.page === totalPages - 1,
        number: pageRequest.page,
        numberOfElements: items.length,
        pageable: {
            sort: { sorted: true, unsorted: false, empty: false },
            pageNumber: pageRequest.page,
            pageSize: pageRequest.size,
            offset: pageRequest.page * pageRequest.size,
        },
        size: pageRequest.size,
        sort: {
            sorted: true,
            unsorted: false,
            empty: false,
        },
        totalElements: total,
        totalPages: totalPages,
    };
}

export function createCustomPaginatedResponse<T>(items: T[], total: number, pageRequest: PageRequest): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / pageRequest.size);

    return {
        content: items,
        empty: items.length === 0,
        first: pageRequest.page === 0,
        last: pageRequest.page === totalPages - 1,
        number: pageRequest.page,
        numberOfElements: items.length,
        pageable: {
            sort: { sorted: true, unsorted: false, empty: false },
            pageNumber: pageRequest.page,
            pageSize: pageRequest.size,
            offset: pageRequest.page * pageRequest.size,
        },
        size: pageRequest.size,
        sort: {
            sorted: true,
            unsorted: false,
            empty: false,
        },
        totalElements: total,
        totalPages: totalPages,
    };
}
