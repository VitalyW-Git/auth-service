import { Logger } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { MailService } from '@/libs/mail/mail.service'
import { SendVerificationTokenCommand } from '@/modules/auth/application/commands/send-verification-token.command'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'

@CommandHandler(SendVerificationTokenCommand)
export class SendVerificationTokenHandler
	implements ICommandHandler<SendVerificationTokenCommand>
{
	private readonly logger = new Logger(SendVerificationTokenHandler.name)

	public constructor(
		private readonly tokenGenerationService: TokenGenerationService,
		private readonly mailService: MailService
	) {}

	public async execute(command: SendVerificationTokenCommand): Promise<boolean> {
		const verificationToken =
			await this.tokenGenerationService.generateVerificationToken(
				command.email
			)
		try {
			await this.mailService.sendConfirmationEmail(
				verificationToken.getEmail(),
				verificationToken.getToken()
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email подтверждения на ${command.email}: ${error.message}`,
				error.stack
			)
		}
		return true
	}
}

