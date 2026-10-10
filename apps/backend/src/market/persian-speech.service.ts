import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import { synthesizePersian } from './persian-speech.js';

@Injectable()
export class PersianSpeechService {
  async synthesize(text: string): Promise<Buffer> {
    const spoken = typeof text === 'string' ? text.trim() : '';
    if (!spoken) throw new BadRequestException(t('errors', 'speechEmpty'));
    try {
      return await synthesizePersian(spoken);
    } catch {
      throw new ServiceUnavailableException(t('errors', 'speechDown'));
    }
  }
}
