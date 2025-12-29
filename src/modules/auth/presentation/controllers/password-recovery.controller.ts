import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post
} from '@nestjs/common'
import { Recaptcha } from '@nestlab/google-recaptcha'

import { NewPasswordDto } from '@/modules/auth/application/dto/new-password.dto'
import { ResetPasswordDto } from '@/modules/auth/application/dto/reset-password.dto'
import { PasswordRecoveryService } from '@/modules/auth/infrastructure/password-recovery/password-recovery.service'

@Controller('auth/password-recovery')
export class PasswordRecoveryController {
	constructor(
		private readonly passwordRecoveryService: PasswordRecoveryService
	) {}

	@Recaptcha()
	@Post('reset')
	@HttpCode(HttpStatus.OK)
	public async resetPassword(@Body() resetPassword: ResetPasswordDto) {
		return this.passwordRecoveryService.resetPassword(resetPassword)
	}

	@Recaptcha()
	@Post('new/:token')
	@HttpCode(HttpStatus.OK)
	public async newPassword(
		@Body() dto: NewPasswordDto,
		@Param('token') token: string
	) {
		return this.passwordRecoveryService.newPassword(dto, token)
	}
}
