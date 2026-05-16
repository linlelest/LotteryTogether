import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username: string

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}