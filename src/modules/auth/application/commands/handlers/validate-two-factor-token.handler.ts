import {
	BadRequestException,
	Inject,
	NotFoundException
} from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { ValidateTwoFactorTokenCommand } from '@/modules/auth/application/commands/validate-two-factor-token.command'

@CommandHandler(ValidateTwoFactorTokenCommand)
export class ValidateTwoFactorTokenHandler
	implements ICommandHandler<ValidateTwoFactorTokenCommand>
{
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface
	) {}

	public async execute(
		command: ValidateTwoFactorTokenCommand
	): Promise<boolean> {
		const existingToken = await this.tokenRepository.findByEmailAndType(
			command.email,
			TokenType.TWO_FACTOR
		)
		if (!existingToken) {
			throw new NotFoundException(
				'Токен двухфакторной аутентификации не найден. Убедитесь, что вы запрашивали токен для данного адреса электронной почты.'
			)
		}
		if (!existingToken.isValid(command.code)) {
			throw new BadRequestException(
				'Неверный код двухфакторной аутентификации или токен истек. Пожалуйста, проверьте введенный код и попробуйте снова.'
			)
		}
		await this.tokenRepository.delete(existingToken)
		return true
	}
}

