import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { Type } from 'class-transformer';

export class SymbolQueryDto {
  @ApiPropertyOptional({ example: t('swagger', 'exampleSymbol'), description: t('swagger', 'symbolQuery') })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'true', description: t('swagger', 'ipoOnly') })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  onlyIpo?: string;

  @ApiPropertyOptional({ example: t('swagger', 'exampleMarket'), description: t('swagger', 'marketFilter') })
  @IsOptional()
  @IsString()
  market?: string;

  @ApiPropertyOptional({
    example: 150,
    description: t('swagger', 'limit'),
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: '1',
    description: t('swagger', 'fields'),
  })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  brief?: string;
}
