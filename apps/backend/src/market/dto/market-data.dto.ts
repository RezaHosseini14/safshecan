import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarketQuoteQueryDto {
  @ApiProperty({ description: 'نماد بورسی (مثلاً فزر)', example: 'فزر', required: false })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: 'اجبار بروزرسانی بدون کش', example: 'false' })
  @IsOptional()
  @IsString()
  force?: string;
}

export class MarketWatchBodyDto {
  @ApiProperty({ description: 'نماد بورسی برای پایش لحظه‌ای', example: 'فزر', required: false })
  @IsOptional()
  @IsString()
  symbol?: string;
}
