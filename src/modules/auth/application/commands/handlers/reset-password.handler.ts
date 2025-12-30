import {
	BadRequestException,
	Inject,
	NotFoundException
} from '@nestjs/common'
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs'
import { hash } from 'argon2'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { ResetPasswordCommand } from '@/modules/auth/application/commands/reset-password.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { Password } from '@/modules/user/domain/value-objects/password.value-object'

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		private readonly queryBus: QueryBus,
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface
	) {}

	public async execute(command: ResetPasswordCommand): Promise<boolean> {
		const existingToken = await this.tokenRepository.findByTokenAndType(
			command.token,
			TokenType.PASSWORD_RESET
		)
		if (!existingToken) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}
		if (existingToken.isExpired()) {
			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
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
		const hashedPassword = await hash(command.password)
		const password = Password.fromHashed(hashedPassword)
		existingUser.updatePassword(password)
		await this.userRepository.save(existingUser)
		await this.tokenRepository.delete(existingToken)
		return true
	}
}

