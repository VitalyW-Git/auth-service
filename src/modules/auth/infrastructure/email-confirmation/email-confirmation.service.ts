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

import { MailService } from '@/libs/mail/mail.service'
import { VerifyUserCommand } from '@/modules/user/application/commands/verify-user.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'

import { ConfirmationDto } from '@/modules/auth/application/dto/confirmation.dto'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import {TokenEntity} from "@/modules/auth/infrastructure/persistence/entities/token.entity";
import {TokenType} from "@/modules/auth/application/common/enums/token-type.enum";

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

	public async newVerification(req: Request, confirmation: ConfirmationDto) {
		const existingToken = await this.em.findOne(TokenEntity, {
			token: confirmation.token,
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

	private async generateVerificationToken(email: string): Promise<TokenEntity> {
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		const existingToken = await this.em.findOne(TokenEntity, {
			email,
			type: TokenType.VERIFICATION
		})

		if (existingToken) {
			await this.em.removeAndFlush(existingToken)
		}

		const token = this.em.create(TokenEntity, {
			email,
			token: uuidv4(),
			expiresIn,
			type: TokenType.VERIFICATION
		})

		await this.em.persistAndFlush(token)

		return token
	}
}
