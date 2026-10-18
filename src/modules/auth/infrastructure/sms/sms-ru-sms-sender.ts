import {
	BadRequestException,
	HttpException,
	HttpStatus,
	Logger,
	ServiceUnavailableException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { isDev } from '@/libs/common/utils/is-dev.util'
import { SmsSenderInterface } from '@/modules/auth/domain/common/interfaces/sms-sender.interface'
import { SmsRuSendResponseInterface } from '@/modules/auth/infrastructure/sms/interfaces/sms-ru-send-response.interface'

import {
	SMS_RU_BASE_URL,
	SMS_RU_INVALID_PHONE_CODES,
	SMS_RU_PHONE_LIMIT_CODES,
	SMS_RU_REQUEST_TIMEOUT_MS,
	SMS_RU_SEND_PATH
} from './constants/sms-ru.constants'

/**
 * Отправка через SMS.ru (https://sms.ru/api/send). В тестовом режиме (test=1) SMS.ru проверяет запрос
 * и отвечает как при отправке, но SMS не уходит и баланс не списывается — поэтому текст пишется в лог.
 * Тестовый режим допустим только при NODE_ENV=development.
 */
export class SmsRuSmsSender implements SmsSenderInterface {
	private readonly logger = new Logger(SmsRuSmsSender.name)
	private readonly apiId: string
	private readonly sender: string | undefined
	private readonly testMode: boolean
	private readonly sendUrl: string

	public constructor(configService: ConfigService) {
		const isDevelopment = isDev(configService)
		this.apiId = configService.getOrThrow<string>('SMS_RU_API_ID')
		this.sender = configService.get<string>('SMS_RU_SENDER') || undefined
		this.testMode =
			configService.get<string>(
				'SMS_RU_TEST_MODE',
				isDevelopment ? 'true' : 'false'
			) === 'true'
		if (this.testMode && !isDevelopment) {
			throw new Error(
				'SMS_RU_TEST_MODE=true допустим только при NODE_ENV=development: в тестовом режиме коды не доходят до пользователей.'
			)
		}
		this.sendUrl = this.resolveSendUrl(configService, isDevelopment)
	}

	public isTestMode(): boolean {
		return this.testMode
	}

	public async send(phone: string, text: string): Promise<void> {
		const recipient = phone.replace(/^\+/, '')
		const response = await this.requestSend(recipient, text)
		this.assertSent(recipient, response)
		if (this.testMode) {
			this.logger.warn(
				`SMS на ${phone} (тестовый режим SMS.ru, не отправлено): ${text}`
			)
		}
	}

	/**
	 * Адрес API: SMS_RU_API_URL подменяет https://sms.ru локальной заглушкой (tools/sms-ru-mock.mjs).
	 * Нужно, пока у аккаунта нет согласованного буквенного отправителя — тогда настоящий SMS.ru
	 * отвечает 221 на любой запрос, включая test=1. Подмена разрешена только при NODE_ENV=development.
	 */
	private resolveSendUrl(
		configService: ConfigService,
		isDevelopment: boolean
	): string {
		const baseUrl = configService.get<string>('SMS_RU_API_URL')
		if (!baseUrl) {
			return `${SMS_RU_BASE_URL}${SMS_RU_SEND_PATH}`
		}
		if (!isDevelopment) {
			throw new Error(
				'SMS_RU_API_URL допустим только при NODE_ENV=development: вне разработки SMS должны уходить через sms.ru.'
			)
		}
		this.logger.warn(
			`Запросы идут на заглушку ${baseUrl}, а не в SMS.ru: SMS никому не доставляются.`
		)
		return `${baseUrl.replace(/\/+$/, '')}${SMS_RU_SEND_PATH}`
	}

	private async requestSend(
		recipient: string,
		text: string
	): Promise<SmsRuSendResponseInterface> {
		try {
			const response = await fetch(this.sendUrl, {
				method: 'POST',
				body: this.buildBody(recipient, text),
				signal: AbortSignal.timeout(SMS_RU_REQUEST_TIMEOUT_MS)
			})
			return (await response.json()) as SmsRuSendResponseInterface
		} catch (error) {
			this.logger.error(`SMS.ru недоступен: ${error}`)
			throw new ServiceUnavailableException(
				'Не удалось отправить SMS. Попробуйте позже.'
			)
		}
	}

	private buildBody(recipient: string, text: string): URLSearchParams {
		const body = new URLSearchParams({
			api_id: this.apiId,
			to: recipient,
			msg: text,
			json: '1'
		})
		if (this.sender) {
			body.set('from', this.sender)
		}
		if (this.testMode) {
			body.set('test', '1')
		}
		return body
	}

	// В лог — коды и тексты SMS.ru, но не текст SMS: в нём код входа.
	private assertSent(
		recipient: string,
		response: SmsRuSendResponseInterface
	): void {
		const result = response.sms?.[recipient]
		if (response.status === 'OK' && result?.status === 'OK') {
			return
		}
		const statusCode = result?.status_code ?? response.status_code
		const statusText = result?.status_text ?? response.status_text
		this.logger.error(
			`SMS.ru отклонил отправку: ${statusCode} ${statusText}`
		)
		throw this.toHttpException(statusCode)
	}

	private toHttpException(statusCode: number): HttpException {
		if (SMS_RU_INVALID_PHONE_CODES.includes(statusCode)) {
			return new BadRequestException(
				'На этот номер не удаётся отправить SMS. Проверьте номер.'
			)
		}
		if (SMS_RU_PHONE_LIMIT_CODES.includes(statusCode)) {
			return new HttpException(
				'Слишком много SMS на этот номер. Попробуйте позже.',
				HttpStatus.TOO_MANY_REQUESTS
			)
		}
		return new ServiceUnavailableException(
			'Не удалось отправить SMS. Попробуйте позже.'
		)
	}
}
