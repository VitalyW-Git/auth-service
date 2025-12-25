import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

export const Authorized = createParamDecorator(
	(data: keyof UserEntity, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user

		return data ? user[data] : user
	}
)
