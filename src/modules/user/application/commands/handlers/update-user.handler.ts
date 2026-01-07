import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { UpdateUserCommand } from '@/modules/user/application/commands/update-user.command'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { UserEmail } from '@/modules/user/domain/value-objects/user-email.value-object'

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
	constructor(
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(command: UpdateUserCommand): Promise<UserInterface> {
		const user = await this.userRepository.findById(command.userId)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		const email = UserEmail.create(command.email)
		user.updateEmail(email)
		user.updateDisplayName(command.displayName)

		if (command.isTwoFactorEnabled) {
			user.enableTwoFactor()
		} else {
			user.disableTwoFactor()
		}

		await this.userRepository.save(user)

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
