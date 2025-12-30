import { Logger } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { MailService } from '@/libs/mail/mail.service'
import { SendTwoFactorTokenCommand } from '@/modules/auth/application/commands/send-two-factor-token.command'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'

@CommandHandler(SendTwoFactorTokenCommand)
export class SendTwoFactorTokenHandler
	implements ICommandHandler<SendTwoFactorTokenCommand>
{
	private readonly logger = new Logger(SendTwoFactorTokenHandler.name)

	public constructor(
		private readonly tokenGenerationService: TokenGenerationService,
		private readonly mailService: MailService
	) {}

	public async execute(
		command: SendTwoFactorTokenCommand
	): Promise<boolean> {
		const twoFactorToken =
			await this.tokenGenerationService.generateTwoFactorToken(
				command.email
			)
		try {
			await this.mailService.sendTwoFactorTokenEmail(
				twoFactorToken.getEmail(),
				twoFactorToken.getToken()
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email с двухфакторным токеном на ${command.email}: ${error.message}`,
				error.stack
			)
			throw error
		}
		return true
	}
}

