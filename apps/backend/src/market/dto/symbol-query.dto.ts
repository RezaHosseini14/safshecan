import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SymbolQueryDto {
  @ApiPropertyOptional({ example: 'فزر', description: 'جستجو در نماد، نام شرکت یا صنعت' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'true', description: 'فیلتر فقط عرضه‌های اولیه' })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  onlyIpo?: string;

  @ApiPropertyOptional({ example: 'بورس', description: 'فیلتر بازار (بورس، فرابورس، پایه)' })
  @IsOptional()
  @IsString()
  market?: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'حداکثر تعداد نتایج (پیش‌فرض ۱۵۰، سقف ۱۰۰۰۰)',
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
