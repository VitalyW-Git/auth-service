import {
	BadRequestException,
	Inject,
	NotFoundException
} from '@nestjs/common'
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { ConfirmEmailCommand } from '@/modules/auth/application/commands/confirm-email.command'
import { VerifyUserCommand } from '@/modules/user/application/commands/verify-user.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailHandler implements ICommandHandler<ConfirmEmailCommand> {
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
		private readonly sessionService: SessionService
	) {}

	public async execute(
		command: ConfirmEmailCommand
	): Promise<{ user: any }> {
		const existingToken = await this.tokenRepository.findByTokenAndType(
			command.token,
			TokenType.VERIFICATION
		)
		if (!existingToken) {
			throw new NotFoundException(
				'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
			)
		}
		if (existingToken.isExpired()) {
			throw new BadRequestException(
				'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
			)
		}
		const existingUser = await this.queryBus.execute(
			new GetUserByEmailQuery(existingToken.getEmail())
		)
		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}
		await this.commandBus.execute(new VerifyUserCommand(existingUser.id))
		await this.tokenRepository.delete(existingToken)
		const userResult = new GetUserResult(
			existingUser.id,
			existingUser.getEmail().getValue(),
			existingUser.getDisplayName(),
			existingUser.getPicture(),
			existingUser.getRole(),
			existingUser.getIsVerified(),
			existingUser.getIsTwoFactorEnabled(),
			existingUser.getMethod(),
			existingUser.getCreatedAt(),
			existingUser.getUpdatedAt()
		)
		return this.sessionService.saveSession(command.req, userResult!)
	}
}

