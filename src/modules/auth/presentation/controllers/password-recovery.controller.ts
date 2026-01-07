import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { Recaptcha } from '@nestlab/google-recaptcha'

import { RequestPasswordResetCommand } from '@/modules/auth/application/commands/request-password-reset.command'
import { ResetPasswordCommand } from '@/modules/auth/application/commands/reset-password.command'
import { NewPasswordDto } from '@/modules/auth/presentation/dto/new-password.dto'
import { ResetPasswordDto } from '@/modules/auth/presentation/dto/reset-password.dto'

@Controller('auth/password-recovery')
export class PasswordRecoveryController {
	constructor(private readonly commandBus: CommandBus) {}

	@Recaptcha()
	@Post('reset')
	@HttpCode(HttpStatus.OK)
	public async resetPassword(@Body() resetPassword: ResetPasswordDto) {
		return this.commandBus.execute(
			new RequestPasswordResetCommand(resetPassword.email)
		)
	}

	@Recaptcha()
	@Post('new/:token')
	@HttpCode(HttpStatus.OK)
	public async newPassword(
		@Body() dto: NewPasswordDto,
		@Param('token') token: string
	) {
		return this.commandBus.execute(
			new ResetPasswordCommand(token, dto.password)
		)
	}
}
