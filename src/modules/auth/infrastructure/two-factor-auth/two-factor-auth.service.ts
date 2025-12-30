import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'

import { MailService } from '@/libs/mail/mail.service'
import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'

@Injectable()
export class TwoFactorAuthService {
	private readonly logger = new Logger(TwoFactorAuthService.name)

	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		private readonly mailService: MailService
	) {}

	public async validateTwoFactorToken(email: string, code: string) {
		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.TWO_FACTOR
		)

		if (!existingToken) {
			throw new NotFoundException(
				'Токен двухфакторной аутентификации не найден. Убедитесь, что вы запрашивали токен для данного адреса электронной почты.'
			)
		}

		if (!existingToken.isValid(code)) {
			throw new BadRequestException(
				'Неверный код двухфакторной аутентификации или токен истек. Пожалуйста, проверьте введенный код и попробуйте снова.'
			)
		}

		await this.tokenRepository.delete(existingToken)

		return true
	}

	public async sendTwoFactorToken(email: string) {
		const twoFactorToken = await this.generateTwoFactorToken(email)

		try {
			await this.mailService.sendTwoFactorTokenEmail(
				twoFactorToken.getEmail(),
				twoFactorToken.getToken()
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

		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.TWO_FACTOR
		)

		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}

		const newToken = Token.create(
			email,
			token,
			TokenType.TWO_FACTOR,
			expiresIn
		)

		await this.tokenRepository.save(newToken)

		return newToken
	}
}
