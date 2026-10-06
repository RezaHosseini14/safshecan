import { IsString, IsOptional, IsBooleanString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SymbolQueryDto {
  @ApiPropertyOptional({ example: 'فزر', description: 'جستجو در نماد، نام شرکت یا صنعت' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'true', description: 'فیلتر فقط عرضه‌های اولیه' })
  @IsOptional()
  @IsBooleanString()
  onlyIpo?: string;

  @ApiPropertyOptional({ example: 'بورس', description: 'فیلتر بازار (بورس، فرابورس، پایه)' })
  @IsOptional()
  @IsString()
  market?: string;
}
