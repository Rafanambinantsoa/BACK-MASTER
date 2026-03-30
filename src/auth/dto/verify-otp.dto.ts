import { IsEmail, IsNotEmpty, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP doit contenir 6 chiffres' })
  otp: string;
}

