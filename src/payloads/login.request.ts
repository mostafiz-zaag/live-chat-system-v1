import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Created by IntelliJ IDEA.
 * User: Joniyed Bhuiyan
 * Date: ১৫/৪/২৪
 * Time: ১১:২৯ AM
 * Email: joniyed.bhuiyan@gmail.com
 */

export class LoginRequest {
  @ApiProperty()
  @IsNotEmpty({ message: '{username.not_empty}' })
  @IsString({ message: '{username.not_null}' })
  @Length(1, 50, { message: 'Username must be between 1 and 15 characters' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: '{password.not_empty}' })
  @IsString({ message: '{password.not_null}' })
  // @Length(8, 255, { message: 'Password must be between 8 to 255 characters' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operatingSystemVersion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sdkVersion?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  idAddress?: string;
}
