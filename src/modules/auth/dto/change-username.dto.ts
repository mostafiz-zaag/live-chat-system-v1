import { IsNotEmpty } from 'class-validator';

export class ChangeUsernameDto {
    @IsNotEmpty()
    oldUsername: string;

    @IsNotEmpty()
    newUsername: string;
}
