import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'

import { UserEmail } from '../../../domain/value-objects/user-email.value-object'
import { IUserRepository } from '../../../domain/repository-interfaces/user.repository.interface'
import { UpdateUserCommand } from '../update-user.command'
import {GetUserResult} from "@/modules/user/application/queries/get-user.query";
import {UserInterface} from "@/modules/user/application/common/interface/user.interface";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository
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

