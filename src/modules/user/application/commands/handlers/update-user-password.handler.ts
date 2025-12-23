import { Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { hash } from 'argon2'

import { UpdateUserPasswordCommand } from '@/modules/user/application/commands/update-user-password.command'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { Password } from '@/modules/user/domain/value-objects/password.value-object'

@CommandHandler(UpdateUserPasswordCommand)
export class UpdateUserPasswordHandler
	implements ICommandHandler<UpdateUserPasswordCommand>
{
	constructor(
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(
		command: UpdateUserPasswordCommand
	): Promise<{ userId: string }> {
		const user = await this.userRepository.findByEmail(command.email)
		if (!user) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}
		user.updatePassword(Password.fromHashed(await hash(command.password)))
		await this.userRepository.save(user)
		return { userId: user.id }
	}
}
