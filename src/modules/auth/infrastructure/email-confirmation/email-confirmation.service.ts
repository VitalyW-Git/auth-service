import { EntityManager } from '@mikro-orm/core'
import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { Token, TokenType } from '@/database/entities'
import { MailService } from '@/libs/mail/mail.service'
import { VerifyUserCommand } from '@/modules/user/application/commands/verify-user.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import {
	GetUserResult
} from '@/modules/user/application/queries/get-user.query'

import { ConfirmationDto } from '../../application/dto/confirmation.dto'
import { SessionService } from '../session/session.service'

@Injectable()
export class EmailConfirmationService {
	private readonly logger = new Logger(EmailConfirmationService.name)

	public constructor(
		private readonly em: EntityManager,
		private readonly mailService: MailService,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
		private readonly sessionService: SessionService
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

		const existingUser = await this.queryBus.execute(
			new GetUserByEmailQuery(existingToken.email)
		)

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		await this.commandBus.execute(new VerifyUserCommand(existingUser.id))
		await this.em.removeAndFlush(existingToken)

		const userResult = new GetUserResult(
			existingUser.id,
			existingUser.getEmail().getValue(),
			existingUser.getDisplayName(),
			existingUser.getPicture(),
			existingUser.getRole(),
			existingUser.getIsVerified(),
			existingUser.getIsTwoFactorEnabled(),
			existingUser.getMethod(),
			existingUser.getCreatedAt(),
			existingUser.getUpdatedAt()
		)
		return this.sessionService.saveSession(req, userResult!)
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
