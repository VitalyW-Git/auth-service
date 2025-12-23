import { HttpException, HttpStatus, Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { SendPhoneCodeCommand } from '@/modules/auth/application/commands/send-phone-code.command'
import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { SmsSenderInterface } from '@/modules/auth/domain/common/interfaces/sms-sender.interface'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'

// Код отправляется на любой номер, в том числе без аккаунта: так нельзя узнать, кто зарегистрирован.
@CommandHandler(SendPhoneCodeCommand)
export class SendPhoneCodeHandler
	implements ICommandHandler<SendPhoneCodeCommand>
{
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		@Inject('SmsSenderInterface')
		private readonly smsSender: SmsSenderInterface,
		private readonly tokenGenerationService: TokenGenerationService
	) {}

	public async execute(command: SendPhoneCodeCommand): Promise<boolean> {
		await this.assertCanResend(command.phone)
		const code = await this.tokenGenerationService.generatePhoneCode(
			command.phone
		)
		await this.smsSender.send(
			command.phone,
			`Код для входа: ${code}. Никому его не сообщайте.`
		)
		return true
	}

	private async assertCanResend(phone: string): Promise<void> {
		const existingToken = await this.tokenRepository.findByPhoneAndType(
			phone,
			TokenType.PHONE_VERIFICATION
		)
		if (existingToken && !existingToken.canResend()) {
			throw new HttpException(
				`Код уже отправлен. Повторно запросить его можно через ${existingToken.getSecondsUntilResend()} с.`,
				HttpStatus.TOO_MANY_REQUESTS
			)
		}
	}
}
