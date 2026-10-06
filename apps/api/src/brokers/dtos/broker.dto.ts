import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyPresetDto {
  @ApiProperty({ example: 'tadbir', description: 'شناسه کارگزاری مورد نظر' })
  @IsString()
  @IsNotEmpty()
  presetId!: string;
}

export class ParseCurlDto {
  @ApiPropertyOptional({ example: "curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' -H 'Authorization: Bearer ...'" })
  @IsOptional()
  @IsString()
  curl?: string;

  @ApiPropertyOptional({ example: "curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' -H 'Authorization: Bearer ...'" })
  @IsOptional()
  @IsString()
  curlCommand?: string;
}
