import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req
} from '@nestjs/common'
import { Request } from 'express'

import { ConfirmationDto } from '@/modules/auth/application/dto/confirmation.dto'
import { EmailConfirmationService } from '@/modules/auth/infrastructure/email-confirmation/email-confirmation.service'

@Controller('auth/email-confirmation')
export class EmailConfirmationController {
	constructor(
		private readonly emailConfirmationService: EmailConfirmationService
	) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	public async newVerification(
		@Req() req: Request,
		@Body() confirmation: ConfirmationDto
	) {
		return this.emailConfirmationService.newVerification(req, confirmation)
	}
}
