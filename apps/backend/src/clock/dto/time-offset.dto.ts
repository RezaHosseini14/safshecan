import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';

export class TimeOffsetDto {
  @ApiProperty({ example: -15, description: t('swagger', 'manualOffset') })
  @IsNumber()
  offsetMs!: number;
}
