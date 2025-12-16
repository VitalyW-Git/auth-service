import { forwardRef, Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'
import { MailModule } from '@/libs/mail/mail.module'
import { MailService } from '@/libs/mail/mail.service'
import { UserModule } from '@/user/user.module'

import { AuthModule } from '../auth.module'

import { EmailConfirmationController } from './email-confirmation.controller'
import { EmailConfirmationService } from './email-confirmation.service'

@Module({
	imports: [
		DatabaseModule,
		UserModule,
		MailModule,
		forwardRef(() => AuthModule)
	],
	controllers: [EmailConfirmationController],
	providers: [EmailConfirmationService, MailService],
	exports: [EmailConfirmationService]
})
export class EmailConfirmationModule {}
