import { BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { ResetPasswordCommand } from '@/modules/auth/application/commands/reset-password.command'
import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { TokenHasherInterface } from '@/modules/auth/domain/common/interfaces/token-hasher.interface'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { UpdateUserPasswordCommand } from '@/modules/user/application/commands/update-user-password.command'

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
	implements ICommandHandler<ResetPasswordCommand>
{
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		@Inject('TokenHasherInterface')
		private readonly tokenHasher: TokenHasherInterface,
		private readonly commandBus: CommandBus,
		private readonly sessionService: SessionService
	) {}

	public async execute(command: ResetPasswordCommand): Promise<boolean> {
		const token = await this.findValidToken(command.token)
		const { userId } = await this.commandBus.execute<
			UpdateUserPasswordCommand,
			{ userId: string }
		>(new UpdateUserPasswordCommand(token.getEmail(), command.password))
		// Сброс пароля часто означает, что аккаунт взломан: завершаем сессии на всех устройствах.
		await this.sessionService.destroyUserSessions(userId)
		await this.tokenRepository.delete(token)
		return true
	}

	private async findValidToken(value: string): Promise<Token> {
		const token = await this.tokenRepository.findByTokenHashAndType(
			this.tokenHasher.hash(value),
			TokenType.PASSWORD_RESET
		)
		if (!token) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}
		if (token.isExpired()) {
			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
			)
		}
		return token
	}
}
