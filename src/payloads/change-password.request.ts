import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/**
 * Created by IntelliJ IDEA.
 * User: Joniyed Bhuiyan
 * Date: ১৫/৪/২৪
 * Time: ১১:২৯ AM
 * Email: joniyed.bhuiyan@gmail.com
 */

export class ChangePasswordRequest {
  @IsOptional() // This allows the value to be null or undefined
  @IsString({ message: 'Must be a string' })
  @Length(1, 255, {
    message: 'Old password must be between 1 and 255 characters',
  })
  oldPassword?: string | null; // Make the property optional and allow null

  @IsNotEmpty({ message: '{username.not_empty}' })
  @IsString({ message: '{username.not_null}' })
  @Length(1, 255, { message: 'Username must be between 1 and 255 characters' })
  newPassword: string;
}
