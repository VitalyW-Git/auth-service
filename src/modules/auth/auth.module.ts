import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'

import { getProvidersConfig } from '@/config/providers.config'
import { getRecaptchaConfig } from '@/config/recaptcha.config'
import { DatabaseModule } from '@/database/database.module'
import { MailService } from '@/libs/mail/mail.service'
import { ConfirmEmailHandler } from '@/modules/auth/application/commands/handlers/confirm-email.handler'
import { LoginHandler } from '@/modules/auth/application/commands/handlers/login.handler'
import { LogoutHandler } from '@/modules/auth/application/commands/handlers/logout.handler'
import { OAuthCallbackHandler } from '@/modules/auth/application/commands/handlers/oauth-callback.handler'
import { RegisterHandler } from '@/modules/auth/application/commands/handlers/register.handler'
import { RequestPasswordResetHandler } from '@/modules/auth/application/commands/handlers/request-password-reset.handler'
import { ResetPasswordHandler } from '@/modules/auth/application/commands/handlers/reset-password.handler'
import { SendTwoFactorTokenHandler } from '@/modules/auth/application/commands/handlers/send-two-factor-token.handler'
import { SendVerificationTokenHandler } from '@/modules/auth/application/commands/handlers/send-verification-token.handler'
import { ValidateTwoFactorTokenHandler } from '@/modules/auth/application/commands/handlers/validate-two-factor-token.handler'
import { TokenGenerationService } from '@/modules/auth/domain/services/token-generation.service'
import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import { TokenEntity } from '@/modules/auth/infrastructure/persistence/entities/token.entity'
import { ProviderModule } from '@/modules/auth/infrastructure/provider/provider.module'
import { AccountRepository } from '@/modules/auth/infrastructure/repositories/account.repository'
import { TokenRepository } from '@/modules/auth/infrastructure/repositories/token.repository'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { AuthController } from '@/modules/auth/presentation/controllers/auth.controller'
import { EmailConfirmationController } from '@/modules/auth/presentation/controllers/email-confirmation.controller'
import { PasswordRecoveryController } from '@/modules/auth/presentation/controllers/password-recovery.controller'
import { UserModule } from '@/modules/user/user.module'

const CommandHandlers = [
	RegisterHandler,
	LoginHandler,
	LogoutHandler,
	OAuthCallbackHandler,
	SendVerificationTokenHandler,
	ConfirmEmailHandler,
	RequestPasswordResetHandler,
	ResetPasswordHandler,
	SendTwoFactorTokenHandler,
	ValidateTwoFactorTokenHandler
]

@Module({
	imports: [
		CqrsModule,
		MikroOrmModule.forFeature([AccountEntity, TokenEntity]),
		DatabaseModule,
		UserModule,
		ProviderModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getProvidersConfig,
			inject: [ConfigService]
		}),
		GoogleRecaptchaModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: getRecaptchaConfig,
			inject: [ConfigService]
		})
	],
	controllers: [
		AuthController,
		EmailConfirmationController,
		PasswordRecoveryController
	],
	providers: [
		...CommandHandlers,
		TokenGenerationService,
		SessionService,
		MailService,
		{
			provide: 'AccountRepositoryInterface',
			useClass: AccountRepository
		},
		{
			provide: 'TokenRepositoryInterface',
			useClass: TokenRepository
		}
	]
})
export class AuthModule {}
