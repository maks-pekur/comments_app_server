import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CaptchaService {
  async verifyCaptcha(token: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET || '',
          response: token,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (!response.data.success) {
        throw new BadRequestException('CAPTCHA не пройдена');
      }

      return true;
    } catch (error) {
      throw new BadRequestException('Ошибка при проверке CAPTCHA');
    }
  }
}
