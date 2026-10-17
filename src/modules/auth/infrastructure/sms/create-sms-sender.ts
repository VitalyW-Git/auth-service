import { ConfigService } from '@nestjs/config'

import { SmsSenderInterface } from '@/modules/auth/domain/common/interfaces/sms-sender.interface'

import { LogSmsSender } from './log-sms-sender'
import { SmsRuSmsSender } from './sms-ru-sms-sender'

// Задан SMS_RU_API_ID — отправка через SMS.ru, иначе текст SMS только в лог (и только в разработке).
export const createSmsSender = (
	configService: ConfigService
): SmsSenderInterface =>
	configService.get<string>('SMS_RU_API_ID')
		? new SmsRuSmsSender(configService)
		: new LogSmsSender(configService)
