import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from '@/auth/auth.module'
import { EmailConfirmationModule } from '@/auth/email-confirmation/email-confirmation.module'
import { PasswordRecoveryModule } from '@/auth/password-recovery/password-recovery.module'
import { ProviderModule } from '@/auth/provider/provider.module'
import { TwoFactorAuthModule } from '@/auth/two-factor-auth/two-factor-auth.module'
import { DatabaseModule } from '@/database/database.module'
import { MailModule } from '@/libs/mail/mail.module'
import { SessionModule } from '@/libs/session/session.module'
import { UserModule } from '@/user/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			ignoreEnvFile: process.env.NODE_ENV !== 'development',
			isGlobal: true
		}),
		DatabaseModule,
		SessionModule,
		AuthModule,
		UserModule,
		ProviderModule,
		MailModule,
		EmailConfirmationModule,
		PasswordRecoveryModule,
		TwoFactorAuthModule
	]
})
export class AppModule {}
