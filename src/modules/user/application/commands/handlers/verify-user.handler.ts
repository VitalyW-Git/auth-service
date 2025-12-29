import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { VerifyUserCommand } from '@/modules/user/application/commands/verify-user.command'

@CommandHandler(VerifyUserCommand)
export class VerifyUserHandler implements ICommandHandler<VerifyUserCommand> {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(command: VerifyUserCommand): Promise<void> {
		const user = await this.userRepository.findById(command.userId)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		user.verify()

		await this.userRepository.save(user)
	}
}
