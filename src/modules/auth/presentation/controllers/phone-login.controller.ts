import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { Recaptcha } from '@nestlab/google-recaptcha'
import { Request } from 'express'

import { LoginByPhoneCommand } from '@/modules/auth/application/commands/login-by-phone.command'
import { SendPhoneCodeCommand } from '@/modules/auth/application/commands/send-phone-code.command'
import { PhoneLoginDto } from '@/modules/auth/presentation/dto/phone-login.dto'
import { SendPhoneCodeDto } from '@/modules/auth/presentation/dto/send-phone-code.dto'

// Вход по коду из SMS (ADR 0011). Новый номер получает аккаунт после верного кода.
@Controller('auth/phone')
export class PhoneLoginController {
	public constructor(private readonly commandBus: CommandBus) {}

	// reCAPTCHA защищает платную отправку SMS от перебора номеров; в разработке не проверяется.
	@Recaptcha()
	@Post('code')
	@HttpCode(HttpStatus.OK)
	public async sendCode(@Body() dto: SendPhoneCodeDto): Promise<boolean> {
		return this.commandBus.execute(new SendPhoneCodeCommand(dto.phone))
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(@Req() req: Request, @Body() dto: PhoneLoginDto) {
		return this.commandBus.execute(
			new LoginByPhoneCommand(dto.phone, dto.code, req)
		)
	}
}
