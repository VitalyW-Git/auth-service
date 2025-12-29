import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'

import { MailService } from '@/libs/mail/mail.service'
import { TokenType } from '@/modules/auth/application/common/enums/token-type.enum'
import { NewPasswordDto } from '@/modules/auth/application/dto/new-password.dto'
import { ResetPasswordDto } from '@/modules/auth/application/dto/reset-password.dto'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { Password } from '@/modules/user/domain/value-objects/password.value-object'

@Injectable()
export class PasswordRecoveryService {
	private readonly logger = new Logger(PasswordRecoveryService.name)

	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		private readonly queryBus: QueryBus,
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface,
		private readonly mailService: MailService
	) {}

	public async resetPassword(resetPassword: ResetPasswordDto) {
		const existingUser = await this.queryBus.execute(
			new GetUserByEmailQuery(resetPassword.email)
		)

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		const passwordResetToken = await this.generatePasswordResetToken(
			existingUser.getEmail().getValue()
		)

		try {
			await this.mailService.sendPasswordResetEmail(
				passwordResetToken.getEmail(),
				passwordResetToken.getToken()
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email для сброса пароля на ${resetPassword.email}: ${error.message}`,
				error.stack
			)
			throw error
		}

		return true
	}

	public async newPassword(dto: NewPasswordDto, token: string) {
		const existingToken = await this.tokenRepository.findByTokenAndType(
			token,
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

		const hashedPassword = await hash(dto.password)
		const password = Password.fromHashed(hashedPassword)
		existingUser.updatePassword(password)
		await this.userRepository.save(existingUser)
		await this.tokenRepository.delete(existingToken)

		return true
	}

	private async generatePasswordResetToken(email: string): Promise<Token> {
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.PASSWORD_RESET
		)

		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}

		const newToken = Token.create(
			email,
			uuidv4(),
			TokenType.PASSWORD_RESET,
			expiresIn
		)

		await this.tokenRepository.save(newToken)

		return newToken
	}
}
