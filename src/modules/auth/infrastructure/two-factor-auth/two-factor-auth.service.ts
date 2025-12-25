import { EntityManager } from '@mikro-orm/core'
import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'

import { Token, TokenType } from '@/database/entities'
import { MailService } from '@/libs/mail/mail.service'

@Injectable()
export class TwoFactorAuthService {
	private readonly logger = new Logger(TwoFactorAuthService.name)

	public constructor(
		private readonly em: EntityManager,
		private readonly mailService: MailService
	) {}

	public async validateTwoFactorToken(email: string, code: string) {
		const existingToken = await this.em.findOne(Token, {
			email,
			type: TokenType.TWO_FACTOR
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Токен двухфакторной аутентификации не найден. Убедитесь, что вы запрашивали токен для данного адреса электронной почты.'
			)
		}

		if (existingToken.token !== code) {
			throw new BadRequestException(
				'Неверный код двухфакторной аутентификации. Пожалуйста, проверьте введенный код и попробуйте снова.'
			)
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			throw new BadRequestException(
				'Срок действия токена двухфакторной аутентификации истек. Пожалуйста, запросите новый токен.'
			)
		}

		await this.em.removeAndFlush(existingToken)

		return true
	}

	public async sendTwoFactorToken(email: string) {
		const twoFactorToken = await this.generateTwoFactorToken(email)

		try {
			await this.mailService.sendTwoFactorTokenEmail(
				twoFactorToken.email,
				twoFactorToken.token
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email с двухфакторным токеном на ${email}: ${error.message}`,
				error.stack
			)
			throw error
		}

		return true
	}

	private async generateTwoFactorToken(email: string): Promise<Token> {
		const token: string = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()
		const expiresIn = new Date(new Date().getTime() + 300000)

		const existingToken = await this.em.findOne(Token, {
			email,
			type: TokenType.TWO_FACTOR
		})

		if (existingToken) {
			await this.em.removeAndFlush(existingToken)
		}

		const newToken = this.em.create(Token, {
			email,
			token,
			expiresIn,
			type: TokenType.TWO_FACTOR
		})

		await this.em.persistAndFlush(newToken)

		return newToken
	}
}

