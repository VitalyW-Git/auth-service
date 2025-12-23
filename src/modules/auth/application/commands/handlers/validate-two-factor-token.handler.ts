import { BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { ValidateTwoFactorTokenCommand } from '@/modules/auth/application/commands/validate-two-factor-token.command'
import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { TokenHasherInterface } from '@/modules/auth/domain/common/interfaces/token-hasher.interface'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'

@CommandHandler(ValidateTwoFactorTokenCommand)
export class ValidateTwoFactorTokenHandler
	implements ICommandHandler<ValidateTwoFactorTokenCommand>
{
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		@Inject('TokenHasherInterface')
		private readonly tokenHasher: TokenHasherInterface
	) {}

	public async execute(
		command: ValidateTwoFactorTokenCommand
	): Promise<boolean> {
		const token = await this.registerAttempt(command.email)
		if (token.isAttemptsExceeded()) {
			await this.tokenRepository.delete(token)
			throw new BadRequestException(
				'Превышено число попыток ввода кода. Войдите заново, чтобы получить новый код.'
			)
		}
		if (!token.isValid(this.tokenHasher.hash(command.code))) {
			throw await this.buildRejection(token)
		}
		await this.tokenRepository.delete(token)
		return true
	}

	private async registerAttempt(email: string): Promise<Token> {
		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.TWO_FACTOR
		)
		const token = existingToken
			? await this.tokenRepository.incrementAttempts(existingToken)
			: null
		if (!token) {
			throw new NotFoundException(
				'Токен двухфакторной аутентификации не найден. Убедитесь, что вы запрашивали токен для данного адреса электронной почты.'
			)
		}
		return token
	}

	private async buildRejection(token: Token): Promise<BadRequestException> {
		const remainingAttempts = token.getRemainingAttempts()
		if (remainingAttempts === 0) {
			await this.tokenRepository.delete(token)
			return new BadRequestException(
				'Неверный код двухфакторной аутентификации. Попытки исчерпаны — войдите заново, чтобы получить новый код.'
			)
		}
		return new BadRequestException(
			`Неверный код двухфакторной аутентификации или токен истек. Осталось попыток: ${remainingAttempts}.`
		)
	}
}
