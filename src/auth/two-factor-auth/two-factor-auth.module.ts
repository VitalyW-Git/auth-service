import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'
import { MailService } from '@/libs/mail/mail.service'

import { TwoFactorAuthService } from './two-factor-auth.service'

@Module({
	imports: [DatabaseModule],
	providers: [TwoFactorAuthService, MailService]
})
export class TwoFactorAuthModule {}
