// src/models/custom-principal.model.ts

import { LiteCustomPrincipal } from './lite-custom.principle';

export class CustomPrincipal {
    constructor(
        public userId: number,
        public username: string,
        public roleAliases: string,
        public active: boolean,
    ) {}

    // Method to convert to LiteCustomPrincipal
    liteUser(): LiteCustomPrincipal {
        return new LiteCustomPrincipal(this.userId, this.username);
    }
}
