import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'

import { User } from '../../../domain/entities/user.entity'
import { IUserRepository } from '../../../domain/repository-interfaces/user.repository.interface'
import { GetUserByEmailQuery } from '../get-user-by-email.query'

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
	implements IQueryHandler<GetUserByEmailQuery>
{
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository
	) {}

	async execute(query: GetUserByEmailQuery): Promise<User | null> {
		return await this.userRepository.findByEmail(query.email)
	}
}

