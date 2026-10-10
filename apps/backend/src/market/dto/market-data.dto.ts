import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class MarketQuoteQueryDto {
  @ApiProperty({ description: t('swagger', 'quoteSymbol'), example: t('swagger', 'exampleSymbol'), required: false })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: t('swagger', 'forceRefresh'), example: 'false' })
  @IsOptional()
  @IsString()
  force?: string;
}

export class MarketSpeechBodyDto {
  @ApiProperty({ description: t('swagger', 'speechText'), maxLength: 2000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

export class MarketWatchBodyDto {
  @ApiProperty({ description: t('swagger', 'watchSymbol'), example: t('swagger', 'exampleSymbol'), required: false })
  @IsOptional()
  @IsString()
  symbol?: string;
}
