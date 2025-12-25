import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { getProvidersConfig } from '@/config/providers.config'
import { getRecaptchaConfig } from '@/config/recaptcha.config'
import { DatabaseModule } from '@/database/database.module'
import { MailService } from '@/libs/mail/mail.service'
import { UserModule } from '@/modules/user/user.module'

import { AuthController } from '@/modules/auth/presentation/controllers/auth.controller'
import { EmailConfirmationController } from '@/modules/auth/presentation/controllers/email-confirmation.controller'
import { PasswordRecoveryController } from '@/modules/auth/presentation/controllers/password-recovery.controller'
import { RegisterHandler } from '@/modules/auth/application/commands/handlers/register.handler'
import { LoginHandler } from '@/modules/auth/application/commands/handlers/login.handler'
import { LogoutHandler } from '@/modules/auth/application/commands/handlers/logout.handler'
import { OAuthCallbackHandler } from '@/modules/auth/application/commands/handlers/oauth-callback.handler'
import { EmailConfirmationService } from '@/modules/auth/infrastructure/email-confirmation/email-confirmation.service'
import { PasswordRecoveryService } from '@/modules/auth/infrastructure/password-recovery/password-recovery.service'
import { TwoFactorAuthService } from '@/modules/auth/infrastructure/two-factor-auth/two-factor-auth.service'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { AccountRepository } from '@/modules/auth/infrastructure/repositories/account.repository'
import { ProviderModule } from '@/modules/auth/infrastructure/provider/provider.module'
import {AccountEntity} from "@/modules/auth/infrastructure/persistence/entities/account.entity";

const CommandHandlers = [
	RegisterHandler,
	LoginHandler,
	LogoutHandler,
	OAuthCallbackHandler
]

@Module({
	imports: [
    CqrsModule,
    MikroOrmModule.forFeature([AccountEntity]),
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
		MailService,
		{
			provide: 'IAccountRepository',
			useClass: AccountRepository
		}
	]
})
export class AuthModule {}

