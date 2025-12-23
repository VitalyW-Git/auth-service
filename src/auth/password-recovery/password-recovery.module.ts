import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { DatabaseModule } from '@/database/database.module'
import { MailService } from '@/libs/mail/mail.service'
import { UserModule } from '@/modules/user/user.module'

import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
	imports: [DatabaseModule, CqrsModule, UserModule],
	controllers: [PasswordRecoveryController],
	providers: [PasswordRecoveryService, MailService]
})
export class PasswordRecoveryModule {}
