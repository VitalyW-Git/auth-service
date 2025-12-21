import { EntityManager } from '@mikro-orm/core'
import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { Token, TokenType } from '@/database/entities'
import { MailService } from '@/libs/mail/mail.service'
import { UserService } from '@/user/user.service'

import { AuthService } from '../auth.service'

import { ConfirmationDto } from './dto/confirmation.dto'

@Injectable()
export class EmailConfirmationService {
	private readonly logger = new Logger(EmailConfirmationService.name)

	public constructor(
		private readonly em: EntityManager,
		private readonly mailService: MailService,
		private readonly userService: UserService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService
	) {}

	public async newVerification(req: Request, dto: ConfirmationDto) {
		const existingToken = await this.em.findOne(Token, {
			token: dto.token,
			type: TokenType.VERIFICATION
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
			)
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			throw new BadRequestException(
				'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
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

		existingUser.isVerified = true
		await this.em.removeAndFlush(existingToken)
		await this.em.flush()

		return this.authService.saveSession(req, existingUser)
	}

	public async sendVerificationToken(email: string) {
		const verificationToken = await this.generateVerificationToken(email)

		console.log(verificationToken)
		try {
			await this.mailService.sendConfirmationEmail(
				verificationToken.email,
				verificationToken.token
			)
		} catch (error) {
			this.logger.error(
				`Не удалось отправить email подтверждения на ${email}: ${error.message}`,
				error.stack
			)
		}

		return true
	}

	private async generateVerificationToken(email: string): Promise<Token> {
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		const existingToken = await this.em.findOne(Token, {
			email,
			type: TokenType.VERIFICATION
		})

		if (existingToken) {
			await this.em.removeAndFlush(existingToken)
		}

		const token = this.em.create(Token, {
			email,
			token: uuidv4(),
			expiresIn,
			type: TokenType.VERIFICATION
		})

		await this.em.persistAndFlush(token)

		return token
	}
}
