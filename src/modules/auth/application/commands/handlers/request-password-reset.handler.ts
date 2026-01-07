import { Logger, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs'

import { MailService } from '@/libs/mail/mail.service'
import { RequestPasswordResetCommand } from '@/modules/auth/application/commands/request-password-reset.command'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'

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
		const existingUser = await this.queryBus.execute(
			new GetUserByEmailQuery(command.email)
		)
		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}
		const passwordResetToken =
			await this.tokenGenerationService.generatePasswordResetToken(
				existingUser.getEmail().getValue()
			)
		try {
			await this.mailService.sendPasswordResetEmail(
				passwordResetToken.getEmail(),
				passwordResetToken.getToken()
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
