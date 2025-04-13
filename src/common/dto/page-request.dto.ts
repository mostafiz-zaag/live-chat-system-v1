export class PageRequest {
    page: number;
    size: number;

    constructor(page: number, size: number) {
        this.page = page ? page : 0;
        this.size = size ? size : 10;
    }
}
