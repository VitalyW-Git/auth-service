import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { Request } from 'express'

import { ConfirmationDto } from '@/modules/auth/presentation/dto/confirmation.dto'
import { ConfirmEmailCommand } from '@/modules/auth/application/commands/confirm-email.command'

@Controller('auth/email-confirmation')
export class EmailConfirmationController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	public async newVerification(
		@Req() req: Request,
		@Body() confirmation: ConfirmationDto
	) {
		return this.commandBus.execute(
			new ConfirmEmailCommand(confirmation.token, req)
		)
	}
}
