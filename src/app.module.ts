import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from '@/modules/auth/auth.module'
import { DatabaseModule } from '@/database/database.module'
import { MailModule } from '@/libs/mail/mail.module'
import { SessionModule } from '@/libs/session/session.module'
import { UserModule } from '@/modules/user/user.module'

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
		MailModule
	]
})
export class AppModule {}
