import { EntityManager } from '@mikro-orm/core'
import {
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import { Request, Response } from 'express'

import { Account, AuthMethod } from '@/database/entities'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import {GetUserQuery, GetUserResult} from '@/modules/user/application/queries/get-user.query'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service'
import { ProviderService } from './provider/provider.service'
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service'
import {UserInterface} from "@/modules/user/application/common/interface/user.interface";
import {User} from "@/modules/user/domain/entities/user.entity";

@Injectable()
export class AuthService {
	public constructor(
		private readonly em: EntityManager,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly configService: ConfigService,
		private readonly providerService: ProviderService,
		@Inject(forwardRef(() => EmailConfirmationService))
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService
	) {}

	public async register(dto: RegisterDto) {
		const newUser: UserInterface = await this.commandBus.execute(
			new CreateUserCommand(
				dto.email,
				dto.password,
				dto.name,
				'',
				AuthMethod.CREDENTIALS,
				false
			)
		)

		await this.emailConfirmationService.sendVerificationToken(
			newUser.email
		)

		return {
			message:
				'Вы успешно зарегистрировались. Пожалуйста, подтвердите ваш email. Сообщение было отправлено на ваш почтовый адрес.'
		}
	}

	public async login(req: Request, dto: LoginDto) {
		const user: User = await this.queryBus.execute(
			new GetUserByEmailQuery(dto.email)
		)

		if (!user || !user.getPassword()) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенные данные'
			)
		}

		const isValidPassword = await verify(
			user.getPassword()!.getHashedValue(),
			dto.password
		)

		if (!isValidPassword) {
			throw new UnauthorizedException(
				'Неверный пароль. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.'
			)
		}

		if (!user.getIsVerified()) {
			await this.emailConfirmationService.sendVerificationToken(
				user.getEmail().getValue()
			)
			throw new UnauthorizedException(
				'Ваш email не подтвержден. Пожалуйста, проверьте вашу почту и подтвердите адрес.'
			)
		}

		if (user.getIsTwoFactorEnabled()) {
			if (!dto.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(
					user.getEmail().getValue()
				)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.'
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.getEmail().getValue(),
				dto.code
			)
		}
    const userResult = new GetUserResult(
      user.id,
      user.getEmail().getValue(),
      user.getDisplayName(),
      user.getPicture(),
      user.getRole(),
      user.getIsVerified(),
      user.getIsTwoFactorEnabled(),
      user.getMethod(),
      user.getCreatedAt(),
      user.getUpdatedAt()
    )
		return this.saveSession(req, userResult)
	}

	public async extractProfileFromCode(
		req: Request,
		provider: string,
		code: string
	) {
		const providerInstance = this.providerService.findByService(provider)
		const profile = await providerInstance.findUserByCode(code)

		const account = await this.em.findOne(Account, {
			id: profile.id,
			provider: profile.provider
		})

		let user = account?.userId
			? await this.queryBus.execute(new GetUserQuery(account.userId))
			: null

		if (user) {
			return this.saveSession(req, user)
		}

		user = await this.commandBus.execute(
			new CreateUserCommand(
				profile.email,
				'',
				profile.name,
				profile.picture,
				AuthMethod[profile.provider.toUpperCase()],
				true
			)
		)

		if (!account) {
			const newAccount = this.em.create(Account, {
				user,
				type: 'oauth',
				provider: profile.provider,
				accessToken: profile.access_token,
				refreshToken: profile.refresh_token,
				expiresAt: profile.expires_at
			})

			await this.em.persistAndFlush(newAccount)
		}

		return this.saveSession(req, user)
	}

	public async logout(req: Request, res: Response): Promise<void> {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось завершить сессию. Возможно, возникла проблема с сервером или сессия уже была завершена.'
						)
					)
				}
				res.clearCookie(
					this.configService.getOrThrow<string>('SESSION_NAME')
				)
				resolve()
			})
		})
	}

	public async saveSession(req: Request, user: UserInterface) {
		return new Promise((resolve, reject) => {
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии.'
						)
					)
				}

				resolve({
					user: {
						id: user.id,
						email: user.email,
						displayName: user.displayName,
						picture: user.picture,
						role: user.role,
						isVerified: user.isVerified,
						isTwoFactorEnabled: user.isTwoFactorEnabled,
						method: user.method
					}
				})
			})
		})
	}
}
