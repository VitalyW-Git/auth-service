import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { Authorization } from '@/modules/auth/presentation/decorators/auth.decorator'
import { Authorized } from '@/modules/auth/presentation/decorators/authorized.decorator'
import { UpdateUserCommand } from '@/modules/user/application/commands/update-user.command'
import { GetUserQuery } from '@/modules/user/application/queries/get-user.query'
import { UserRole } from '@/modules/user/domain/common/enums/user-role.enum'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { UpdateUserDto } from '@/modules/user/presentation/dto/update-user.dto'

@Controller('users')
export class UserController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus
	) {}

	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Get('profile')
	public async findProfile(
		@Authorized('id') userId: string
	): Promise<UserInterface> {
		return await this.queryBus.execute(new GetUserQuery(userId))
	}

	@Authorization(UserRole.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Get('by-id/:id')
	public async findById(@Param('id') id: string): Promise<UserInterface> {
		return await this.queryBus.execute(new GetUserQuery(id))
	}

	@Authorization()
	@HttpCode(HttpStatus.OK)
	@Patch('profile')
	public async updateProfile(
		@Authorized('id') userId: string,
		@Body() dto: UpdateUserDto
	): Promise<UserInterface> {
		return await this.commandBus.execute(
			new UpdateUserCommand(
				userId,
				dto.email,
				dto.name,
				dto.isTwoFactorEnabled
			)
		)
	}
}
