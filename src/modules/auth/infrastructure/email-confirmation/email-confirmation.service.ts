import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { MailService } from '@/libs/mail/mail.service'
import { TokenType } from '@/modules/auth/application/common/enums/token-type.enum'
import { ConfirmationDto } from '@/modules/auth/application/dto/confirmation.dto'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { VerifyUserCommand } from '@/modules/user/application/commands/verify-user.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'

@Injectable()
export class EmailConfirmationService {
	private readonly logger = new Logger(EmailConfirmationService.name)

	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		private readonly mailService: MailService,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
		private readonly sessionService: SessionService
	) {}

	public async newVerification(req: Request, confirmation: ConfirmationDto) {
		const existingToken = await this.tokenRepository.findByTokenAndType(
			confirmation.token,
			TokenType.VERIFICATION
		)

		if (!existingToken) {
			throw new NotFoundException(
				'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
			)
		}

		if (existingToken.isExpired()) {
			throw new BadRequestException(
				'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
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

		await this.commandBus.execute(new VerifyUserCommand(existingUser.id))
		await this.tokenRepository.delete(existingToken)

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

		try {
			await this.mailService.sendConfirmationEmail(
				verificationToken.getEmail(),
				verificationToken.getToken()
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

		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.VERIFICATION
		)

		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}

		const token = Token.create(
			email,
			uuidv4(),
			TokenType.VERIFICATION,
			expiresIn
		)

		await this.tokenRepository.save(token)

		return token
	}
}
