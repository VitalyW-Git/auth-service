import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'

import { GetUserQuery } from '@/modules/user/application/queries/get-user.query'

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly queryBus: QueryBus) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()

		if (typeof request.session.userId === 'undefined') {
			throw new UnauthorizedException(
				'Пользователь не авторизован. Пожалуйста, войдите в систему, чтобы получить доступ.'
			)
		}

		const userResult = await this.queryBus.execute(
			new GetUserQuery(request.session.userId)
		)

		request.user = userResult

		return true
	}
}

