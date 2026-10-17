import { BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { LoginByPhoneCommand } from '@/modules/auth/application/commands/login-by-phone.command'
import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { SessionServiceInterface } from '@/modules/auth/domain/common/interfaces/session-service.interface'
import { TokenHasherInterface } from '@/modules/auth/domain/common/interfaces/token-hasher.interface'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { FindOrCreateUserByPhoneCommand } from '@/modules/user/application/commands/find-or-create-user-by-phone.command'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'

// Проверка кода повторяет ValidateTwoFactorTokenHandler: попытка засчитывается до сравнения.
@CommandHandler(LoginByPhoneCommand)
export class LoginByPhoneHandler
	implements ICommandHandler<LoginByPhoneCommand>
{
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		@Inject('TokenHasherInterface')
		private readonly tokenHasher: TokenHasherInterface,
		private readonly commandBus: CommandBus,
		@Inject('SessionServiceInterface')
		private readonly sessionService: SessionServiceInterface
	) {}

	public async execute(
		command: LoginByPhoneCommand
	): Promise<{ user: UserInterface }> {
		await this.validateCode(command.phone, command.code)
		const user: UserInterface = await this.commandBus.execute(
			new FindOrCreateUserByPhoneCommand(command.phone)
		)
		return this.sessionService.saveSession(command.req, user)
	}

	private async validateCode(phone: string, code: string): Promise<void> {
		const token = await this.registerAttempt(phone)
		if (token.isAttemptsExceeded()) {
			await this.tokenRepository.delete(token)
			throw new BadRequestException(
				'Превышено число попыток ввода кода. Запросите новый код.'
			)
		}
		const codeHash = this.tokenHasher.hash(
			Token.buildPhoneCodeHashInput(phone, code)
		)
		if (!token.isValid(codeHash)) {
			throw await this.buildRejection(token)
		}
		await this.tokenRepository.delete(token)
	}

	private async registerAttempt(phone: string): Promise<Token> {
		const existingToken = await this.tokenRepository.findByPhoneAndType(
			phone,
			TokenType.PHONE_VERIFICATION
		)
		const token = existingToken
			? await this.tokenRepository.incrementAttempts(existingToken)
			: null
		if (!token) {
			throw new NotFoundException(
				'Код не найден. Запросите новый код для этого номера.'
			)
		}
		return token
	}

	private async buildRejection(token: Token): Promise<BadRequestException> {
		const remainingAttempts = token.getRemainingAttempts()
		if (remainingAttempts === 0) {
			await this.tokenRepository.delete(token)
			return new BadRequestException(
				'Неверный код. Попытки исчерпаны — запросите новый код.'
			)
		}
		return new BadRequestException(
			`Неверный код или срок его действия истёк. Осталось попыток: ${remainingAttempts}.`
		)
	}
}
