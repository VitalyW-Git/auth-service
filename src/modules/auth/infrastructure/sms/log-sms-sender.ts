import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { isDev } from '@/libs/common/utils/is-dev.util'
import { SmsSenderInterface } from '@/modules/auth/domain/common/interfaces/sms-sender.interface'

/**
 * Без SMS_RU_API_ID: в разработке текст SMS пишется в лог сервера, как письма в MailHog.
 * Вне разработки отправка падает, чтобы коды не утекали в логи. Выбор — createSmsSender.
 */
@Injectable()
export class LogSmsSender implements SmsSenderInterface {
	private readonly logger = new Logger(LogSmsSender.name)

	public constructor(private readonly configService: ConfigService) {}

	public isTestMode(): boolean {
		return true
	}

	public async send(phone: string, text: string): Promise<void> {
		if (!isDev(this.configService)) {
			throw new Error(
				'SMS-провайдер не настроен: отправка SMS возможна только в режиме разработки.'
			)
		}
		this.logger.warn(`SMS на ${phone}: ${text}`)
	}
}
