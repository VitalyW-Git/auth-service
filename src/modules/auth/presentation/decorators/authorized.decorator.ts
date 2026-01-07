import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { GetUserResult } from '@/modules/user/application/queries/get-user.query'

export const Authorized = createParamDecorator(
	(data: keyof GetUserResult, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user

		return data ? user[data] : user
	}
)
