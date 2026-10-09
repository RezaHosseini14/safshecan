import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TimeOffsetDto {
  @ApiProperty({ example: -15, description: 'میزان انحراف دستی زمان به میلی‌ثانیه' })
  @IsNumber()
  offsetMs!: number;
}
