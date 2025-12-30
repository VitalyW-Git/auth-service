import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs'
import { verify } from 'argon2'

import { LoginCommand } from '@/modules/auth/application/commands/login.command'
import { SendVerificationTokenCommand } from '@/modules/auth/application/commands/send-verification-token.command'
import { SendTwoFactorTokenCommand } from '@/modules/auth/application/commands/send-two-factor-token.command'
import { ValidateTwoFactorTokenCommand } from '@/modules/auth/application/commands/validate-two-factor-token.command'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'
import { User } from '@/modules/user/domain/entities/user.entity'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
	public constructor(
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
		private readonly sessionService: SessionService
	) {}

	public async execute(
		command: LoginCommand
	): Promise<{ message?: string; user?: UserInterface }> {
		const user: User = await this.queryBus.execute(
			new GetUserByEmailQuery(command.email)
		)
		if (!user || !user.getPassword()) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенные данные'
			)
		}

		const isValidPassword = await verify(
			user.getPassword()!.getHashedValue(),
			command.password
		)

		if (!isValidPassword) {
			throw new UnauthorizedException(
				'Неверный пароль. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.'
			)
		}

		if (!user.getIsVerified()) {
			await this.commandBus.execute(
				new SendVerificationTokenCommand(user.getEmail().getValue())
			)
			throw new UnauthorizedException(
				'Ваш email не подтвержден. Пожалуйста, проверьте вашу почту и подтвердите адрес.'
			)
		}

		if (user.getIsTwoFactorEnabled()) {
			if (!command.code) {
				await this.commandBus.execute(
					new SendTwoFactorTokenCommand(user.getEmail().getValue())
				)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.'
				}
			}

			await this.commandBus.execute(
				new ValidateTwoFactorTokenCommand(
					user.getEmail().getValue(),
					command.code
				)
			)
		}

		const userResult = new GetUserResult(
			user.id,
			user.getEmail().getValue(),
			user.getDisplayName(),
			user.getPicture(),
			user.getRole(),
			user.getIsVerified(),
			user.getIsTwoFactorEnabled(),
			user.getMethod(),
			user.getCreatedAt(),
			user.getUpdatedAt()
		)

		return this.sessionService.saveSession(command.req, userResult)
	}
}
