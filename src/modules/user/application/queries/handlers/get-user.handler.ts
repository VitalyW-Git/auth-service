import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { UserRepositoryInterface } from '../../../domain/repository-interfaces/user.repository.interface'
import { GetUserQuery, GetUserResult } from '../get-user.query'

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(query: GetUserQuery): Promise<GetUserResult> {
		const user = await this.userRepository.findById(query.userId)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		return new GetUserResult(
			user.id,
			user.getEmail().getValue(),
			user.getDisplayName(),
			user.getPicture(),
			user.getRole(),
			user.getIsVerified(),
			user.getIsTwoFactorEnabled(),
			user.getMethod(),
			user.getCreatedAt(),
			user.getUpdatedAt()
		)
	}
}
