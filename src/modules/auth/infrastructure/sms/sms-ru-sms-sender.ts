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

import { SmsRuSendResponseInterface } from './interfaces/sms-ru-send-response.interface'

const SMS_RU_SEND_URL = 'https://sms.ru/sms/send'
const REQUEST_TIMEOUT_MS = 10000
// Номер не принимает SMS: неверный, нет маршрута, зарубежный при настройке «только РФ».
const INVALID_PHONE_CODES = [202, 207, 214]
// Лимиты SMS.ru на один номер (защита от накрутки кодов).
const PHONE_LIMIT_CODES = [230, 231, 232, 233]

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

	private async requestSend(
		recipient: string,
		text: string
	): Promise<SmsRuSendResponseInterface> {
		try {
			const response = await fetch(SMS_RU_SEND_URL, {
				method: 'POST',
				body: this.buildBody(recipient, text),
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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
		if (INVALID_PHONE_CODES.includes(statusCode)) {
			return new BadRequestException(
				'На этот номер не удаётся отправить SMS. Проверьте номер.'
			)
		}
		if (PHONE_LIMIT_CODES.includes(statusCode)) {
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
