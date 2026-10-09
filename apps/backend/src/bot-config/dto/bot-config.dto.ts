import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderConfigDto {
  @ApiProperty({ example: 'فزر', description: 'نماد سهام' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 25000, description: 'قیمت بر حسب ریال' })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 500, description: 'حجم سفارش' })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: 'BUY', enum: ['BUY', 'SELL'] })
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @ApiProperty({ example: 'custom', description: 'نوع کارگزاری' })
  @IsString()
  brokerType!: string;

  @ApiPropertyOptional({ example: 'IRO1FAZR0001' })
  @IsOptional()
  @IsString()
  isin?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  antiDoubleSpend?: boolean;
}

export class NetworkConfigDto {
  @ApiProperty({ example: 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' })
  @IsString()
  targetUrl!: string;

  @ApiProperty({ example: 'POST', enum: ['POST', 'GET', 'PUT'] })
  @IsIn(['POST', 'GET', 'PUT'])
  method!: 'POST' | 'GET' | 'PUT';

  @ApiProperty({ example: {}, description: 'هدرهای HTTP' })
  @IsOptional()
  headers: Record<string, string> = {};

  @ApiProperty({ example: '{}', description: 'الگوی بدنه درخواست' })
  @IsString()
  bodyTemplate!: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  cookies?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  maxSockets?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  timeoutMs?: number;
}

export class TimingConfigDto {
  @ApiProperty({ example: '08:45:00.000', description: 'ساعت هدف شلیک' })
  @IsString()
  targetTime!: string;

  @ApiProperty({ example: 18, description: 'جبران پینگ بر حسب میلی‌ثانیه' })
  @IsNumber()
  leadTimeMs!: number;

  @ApiProperty({ example: 5, description: 'تعداد شلیک‌های رگباری' })
  @IsNumber()
  burstCount!: number;

  @ApiProperty({ example: 2.5, description: 'فاصله شلیک‌ها بر حسب میلی‌ثانیه' })
  @IsNumber()
  burstIntervalMs!: number;

  @ApiPropertyOptional({ example: 12, description: 'ثانیه شروع پیش‌گرمایش' })
  @IsOptional()
  @IsNumber()
  preWarmSeconds?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  preWarmTimeMs?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  ntpSyncIntervalMs?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  stopOnFirstSuccess?: boolean;
}

export class AccountInfoDto {
  @ApiPropertyOptional({ example: 'کاربر آنلاین بورس' })
  @IsOptional()
  @IsString()
  customerTitle?: string;

  @ApiPropertyOptional({ example: '984210' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional({ example: 'تدبیرپرداز' })
  @IsOptional()
  @IsString()
  brokerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenExpiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minutesLeft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTokenExpired?: boolean;

  @ApiPropertyOptional({ enum: ['BEARER_JWT', 'SESSION_COOKIE', 'BASIC', 'NONE'] })
  @IsOptional()
  @IsString()
  authType?: 'BEARER_JWT' | 'SESSION_COOKIE' | 'BASIC' | 'NONE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class SaveConfigDto {
  @ApiProperty({ type: () => OrderConfigDto })
  @ValidateNested()
  @Type(() => OrderConfigDto)
  order!: OrderConfigDto;

  @ApiProperty({ type: () => NetworkConfigDto })
  @ValidateNested()
  @Type(() => NetworkConfigDto)
  network!: NetworkConfigDto;

  @ApiProperty({ type: () => TimingConfigDto })
  @ValidateNested()
  @Type(() => TimingConfigDto)
  timing!: TimingConfigDto;

  @ApiPropertyOptional({ type: () => AccountInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountInfoDto)
  account?: AccountInfoDto;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  serverPort?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoOpenBrowser?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  soundAlertEnabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  ntpServers?: string[];
}
