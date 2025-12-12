import { Module } from '@nestjs/common'

import { MailService } from '@/libs/mail/mail.service'
import { PrismaModule } from '@/prisma/prisma.module'

import { TwoFactorAuthService } from './two-factor-auth.service'

@Module({
	imports: [PrismaModule],
	providers: [TwoFactorAuthService, MailService]
})
export class TwoFactorAuthModule {}
