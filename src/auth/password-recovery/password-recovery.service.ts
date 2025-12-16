import { EntityManager } from '@mikro-orm/core'
import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'

import { Token, TokenType } from '@/database/entities'
import { MailService } from '@/libs/mail/mail.service'
import { UserService } from '@/user/user.service'

import { NewPasswordDto } from './dto/new-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class PasswordRecoveryService {
	private readonly logger = new Logger(PasswordRecoveryService.name)

	public constructor(
		private readonly em: EntityManager,
		private readonly userService: UserService,
		private readonly mailService: MailService
	) {}

	public async resetPassword(dto: ResetPasswordDto) {
		const existingUser = await this.userService.findByEmail(dto.email)

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		const passwordResetToken = await this.generatePasswordResetToken(
			existingUser.email
		)

		try {
			await this.mailService.sendPasswordResetEmail(
				passwordResetToken.email,
				passwordResetToken.token
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email для сброса пароля на ${dto.email}: ${error.message}`,
				error.stack
			)
			throw error
		}

		return true
	}

	public async newPassword(dto: NewPasswordDto, token: string) {
		const existingToken = await this.em.findOne(Token, {
			token,
			type: TokenType.PASSWORD_RESET
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
			)
		}

		const existingUser = await this.userService.findByEmail(
			existingToken.email
		)

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		existingUser.password = await hash(dto.password)
		await this.em.removeAndFlush(existingToken)
		await this.em.flush()

		return true
	}

	private async generatePasswordResetToken(email: string): Promise<Token> {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		const existingToken = await this.em.findOne(Token, {
			email,
			type: TokenType.PASSWORD_RESET
		})

		if (existingToken) {
			await this.em.removeAndFlush(existingToken)
		}

		const newToken = this.em.create(Token, {
			email,
			token,
			expiresIn,
			type: TokenType.PASSWORD_RESET
		})

		await this.em.persistAndFlush(newToken)

		return newToken
	}
}
