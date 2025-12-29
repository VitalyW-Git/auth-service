import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { GetUserByEmailQuery } from '@/modules/user/application/queries/get-user-by-email.query'
import { User } from '@/modules/user/domain/entities/user.entity'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
	implements IQueryHandler<GetUserByEmailQuery>
{
	constructor(
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(query: GetUserByEmailQuery): Promise<User | null> {
		return await this.userRepository.findByEmail(query.email)
	}
}
