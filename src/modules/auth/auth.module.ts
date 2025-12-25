import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'

import { getProvidersConfig } from '@/config/providers.config'
import { getRecaptchaConfig } from '@/config/recaptcha.config'
import { DatabaseModule } from '@/database/database.module'
import { MailService } from '@/libs/mail/mail.service'
import { UserModule } from '@/modules/user/user.module'

import { AuthController } from './presentation/controllers/auth.controller'
import { EmailConfirmationController } from './presentation/controllers/email-confirmation.controller'
import { PasswordRecoveryController } from './presentation/controllers/password-recovery.controller'
import { RegisterHandler } from './application/commands/handlers/register.handler'
import { LoginHandler } from './application/commands/handlers/login.handler'
import { LogoutHandler } from './application/commands/handlers/logout.handler'
import { OAuthCallbackHandler } from './application/commands/handlers/oauth-callback.handler'
import { EmailConfirmationService } from './infrastructure/email-confirmation/email-confirmation.service'
import { PasswordRecoveryService } from './infrastructure/password-recovery/password-recovery.service'
import { TwoFactorAuthService } from './infrastructure/two-factor-auth/two-factor-auth.service'
import { SessionService } from './infrastructure/session/session.service'
import { ProviderModule } from './infrastructure/provider/provider.module'

const CommandHandlers = [
	RegisterHandler,
	LoginHandler,
	LogoutHandler,
	OAuthCallbackHandler
]

@Module({
	imports: [
		CqrsModule,
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
		EmailConfirmationService,
		PasswordRecoveryService,
		TwoFactorAuthService,
		SessionService,
		MailService
	]
})
export class AuthModule {}

