import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PingDto {
  @ApiPropertyOptional({ example: 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' })
  @IsOptional()
  @IsString()
  url?: string;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ example: 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: { 'User-Agent': 'Mozilla/5.0' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}
