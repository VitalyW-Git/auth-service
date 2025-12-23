import { Logger } from '@nestjs/common'
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs'

import { MailService } from '@/libs/mail/mail.service'
import { RequestPasswordResetCommand } from '@/modules/auth/application/commands/request-password-reset.command'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { User } from '@/modules/user/domain/entities/user.entity'

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler
	implements ICommandHandler<RequestPasswordResetCommand>
{
	private readonly logger = new Logger(RequestPasswordResetHandler.name)

	public constructor(
		private readonly queryBus: QueryBus,
		private readonly tokenGenerationService: TokenGenerationService,
		private readonly mailService: MailService
	) {}

	public async execute(
		command: RequestPasswordResetCommand
	): Promise<boolean> {
		const existingUser: User = await this.queryBus.execute(
			new GetUserByEmailQuery(command.email)
		)
		if (!existingUser) {
			this.logger.warn(
				`Запрошен сброс пароля для незарегистрированного email: ${command.email}`
			)
			return true
		}
		const passwordResetToken =
			await this.tokenGenerationService.generatePasswordResetToken(
				existingUser.getEmail().getValue()
			)
		try {
			await this.mailService.sendPasswordResetEmail(
				passwordResetToken.email,
				passwordResetToken.value
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email для сброса пароля на ${command.email}: ${error.message}`,
				error.stack
			)
			throw error
		}
		return true
	}
}
