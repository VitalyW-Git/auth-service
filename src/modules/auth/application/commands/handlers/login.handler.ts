import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { QueryBus } from '@nestjs/cqrs'
import { verify } from 'argon2'

import { LoginCommand } from '@/modules/auth/application/commands/login.command'
import { EmailConfirmationService } from '@/modules/auth/infrastructure/email-confirmation/email-confirmation.service'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { TwoFactorAuthService } from '@/modules/auth/infrastructure/two-factor-auth/two-factor-auth.service'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'
import { User } from '@/modules/user/domain/entities/user.entity'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
	public constructor(
		private readonly queryBus: QueryBus,
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService,
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
			await this.emailConfirmationService.sendVerificationToken(
				user.getEmail().getValue()
			)
			throw new UnauthorizedException(
				'Ваш email не подтвержден. Пожалуйста, проверьте вашу почту и подтвердите адрес.'
			)
		}

		if (user.getIsTwoFactorEnabled()) {
			if (!command.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(
					user.getEmail().getValue()
				)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.'
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.getEmail().getValue(),
				command.code
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
