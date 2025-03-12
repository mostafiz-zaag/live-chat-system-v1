import { IsNotEmpty, IsNumber, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TotpVerificationRequest {
  @ApiProperty()
  @IsNotEmpty({ message: 'Email must not be null' })
  @Length(1, 50, {
    message: 'Username length must be between 1 to 255 characters',
  })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Please provide a code ' })
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({}, { message: 'Code must be a valid number' })
  code: number;
}
