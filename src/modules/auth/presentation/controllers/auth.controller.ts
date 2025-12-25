import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommandBus } from '@nestjs/cqrs'
import { Recaptcha } from '@nestlab/google-recaptcha'
import { Request, Response } from 'express'

import { LoginCommand } from '@/modules/auth/application/commands/login.command'
import { LogoutCommand } from '@/modules/auth/application/commands/logout.command'
import { OAuthCallbackCommand } from '@/modules/auth/application/commands/oauth-callback.command'
import { RegisterCommand } from '@/modules/auth/application/commands/register.command'
import { LoginDto } from '@/modules/auth/application/dto/login.dto'
import { RegisterDto } from '@/modules/auth/application/dto/register.dto'
import { ProviderService } from '@/modules/auth/infrastructure/provider/provider.service'
import { AuthProviderGuard } from '@/modules/auth/presentation/guards/provider.guard'

@Controller('auth')
export class AuthController {
	public constructor(
		private readonly commandBus: CommandBus,
		private readonly configService: ConfigService,
		private readonly providerService: ProviderService
	) {}

	@Recaptcha()
	@Post('register')
	@HttpCode(HttpStatus.OK)
	public async register(@Body() dto: RegisterDto) {
		return this.commandBus.execute(
			new RegisterCommand(dto.email, dto.password, dto.name)
		)
	}

	@Recaptcha()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(@Req() req: Request, @Body() dto: LoginDto) {
		const loginCommand = new LoginCommand(dto.email, dto.password, dto.code)
		loginCommand.req = req
		return this.commandBus.execute(loginCommand)
	}

	@UseGuards(AuthProviderGuard)
	@Get('/oauth/callback/:provider')
	public async callback(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Query('code') code: string,
		@Param('provider') provider: string
	) {
		if (!code) {
			throw new BadRequestException(
				'Не был предоставлен код авторизации.'
			)
		}
		const authCallbackCommand = new OAuthCallbackCommand(provider, code)
		authCallbackCommand.req = req
		await this.commandBus.execute(authCallbackCommand)

		return res.redirect(
			`${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/dashboard/settings`
		)
	}

	@UseGuards(AuthProviderGuard)
	@Get('/oauth/connect/:provider')
	public async connect(@Param('provider') provider: string) {
		const providerInstance = this.providerService.findByService(provider)

		return {
			url: providerInstance.getAuthUrl()
		}
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		return this.commandBus.execute(new LogoutCommand(req, res))
	}
}
