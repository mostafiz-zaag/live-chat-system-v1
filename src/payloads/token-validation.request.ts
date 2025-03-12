import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Created by IntelliJ IDEA.
 * User: Joniyed Bhuiyan
 * Date: ১৫/৪/২৪
 * Time: ১১:২৯ AM
 * Email: joniyed.bhuiyan@gmail.com
 */

export class TokenValidationRequest {
  @ApiProperty()
  @IsNotEmpty({ message: 'Token must not be empty.' })
  @IsString({ message: 'Token must be a string.' })
  // @Length(1, 255, { message: 'Token must be between 1 and 255 characters' })
  token: string;
}
