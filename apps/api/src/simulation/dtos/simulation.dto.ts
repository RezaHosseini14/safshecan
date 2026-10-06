import { IsNumber, IsOptional, IsString, IsArray, IsIn, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RunBacktestDto {
  @ApiPropertyOptional({ example: 5, description: 'تعداد دفعات اجرای شبیه‌سازی بازگشایی' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(25)
  runs?: number;
}

export class RunHistoricalBacktestDto {
  @ApiPropertyOptional({ example: 50000000, description: 'سرمایه اولیه آزمون به تومان' })
  @IsOptional()
  @IsNumber()
  @Min(1000000)
  initialCapitalToman?: number;

  @ApiPropertyOptional({
    example: 'percent',
    enum: ['fixed', 'percent', 'kelly', 'risk_parity'],
    description: 'روش مدیریت سرمایه و حجم سفارش',
  })
  @IsOptional()
  @IsIn(['fixed', 'percent', 'kelly', 'risk_parity'])
  allocationMode?: 'fixed' | 'percent' | 'kelly' | 'risk_parity';

  @ApiPropertyOptional({ example: 10000000, description: 'تخصیص سرمایه ثابت هر نماد به تومان' })
  @IsOptional()
  @IsNumber()
  fixedAllocationToman?: number;

  @ApiPropertyOptional({ example: 30, description: 'درصد سرمایه در هر عرضه اولیه (بین ۵ تا ۱۰۰)' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  positionSizingPercent?: number;

  @ApiPropertyOptional({
    example: 'fiber',
    enum: ['datacenter', 'fiber', 'mobile4g', 'adsl', 'custom'],
    description: 'پروفایل اتصال و اینترنت شبیه‌سازی شده',
  })
  @IsOptional()
  @IsString()
  connectionType?: 'datacenter' | 'fiber' | 'mobile4g' | 'adsl' | 'custom';

  @ApiPropertyOptional({ example: 16, description: 'پینگ سفارشی به میلی‌ثانیه' })
  @IsOptional()
  @IsNumber()
  customPingMs?: number;

  @ApiPropertyOptional({ example: 2.0, description: 'نوسان جیتر سفارشی به میلی‌ثانیه' })
  @IsOptional()
  @IsNumber()
  customJitterMs?: number;

  @ApiPropertyOptional({
    example: 'auto',
    enum: ['auto', 'tadbir', 'rayan', 'dotin', 'asan', 'sahra'],
    description: 'موتور OMS کارگزاری جهت شبیه‌سازی صف و تاخیر سرور کارگزار',
  })
  @IsOptional()
  @IsIn(['auto', 'tadbir', 'rayan', 'dotin', 'asan', 'sahra'])
  brokerOMS?: 'auto' | 'tadbir' | 'rayan' | 'dotin' | 'asan' | 'sahra';

  @ApiPropertyOptional({ example: 7.2, description: 'جبران پینگ (Lead Time) به میلی‌ثانیه' })
  @IsOptional()
  @IsNumber()
  leadTimeMs?: number;

  @ApiPropertyOptional({ example: 5, description: 'تعداد شلیک رگباری (Burst Count)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  burstCount?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'فاصله شلیک‌ها به میلی‌ثانیه (Burst Interval)' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  burstIntervalMs?: number;

  @ApiPropertyOptional({ type: [String], example: ['فزر', 'پی‌پاد'] })
  @IsOptional()
  @IsArray()
  targetSymbols?: string[];

  @ApiPropertyOptional({ type: [String], example: ['محصولات غذایی', 'رایانه و فناوری اطلاعات'] })
  @IsOptional()
  @IsArray()
  targetSectors?: string[];

  @ApiPropertyOptional({ example: true, description: 'اجرای تحلیل آماری مونت کارلو' })
  @IsOptional()
  @IsBoolean()
  includeMonteCarlo?: boolean;

  @ApiPropertyOptional({ example: 150, description: 'تعداد چرخه‌های شبیه‌سازی مونت کارلو' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  monteCarloIterations?: number;
}
