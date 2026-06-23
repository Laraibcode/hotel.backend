import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @MinLength(6) password: string;
}

export class RegisterDto {
  @IsString() @IsNotEmpty() nickname: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @MinLength(6) password: string;
  @IsString() @MinLength(6) confirmPassword: string;
  @IsString() @MinLength(6) @MaxLength(6) @Matches(/^\d{6}$/) securityPin: string;
  @IsString() @IsNotEmpty() invitationCode: string;
}
