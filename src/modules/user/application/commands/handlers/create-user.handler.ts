import { ConflictException, Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { hash } from 'argon2'
import { v4 } from 'uuid'

import { UserRole } from '@/database/enums'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { User } from '@/modules/user/domain/entities/user.entity'
import { IUserRepository } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { Password } from '@/modules/user/domain/value-objects/password.value-object'
import { UserEmail } from '@/modules/user/domain/value-objects/user-email.value-object'

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository
	) {}

	async execute(command: CreateUserCommand): Promise<User> {
		const email = UserEmail.create(command.email)
		const existingUser = await this.userRepository.findByEmail(
			email.getValue()
		)

		if (existingUser) {
			throw new ConflictException(
				'Регистрация не удалась. Пользователь с таким email уже существует. Пожалуйста, используйте другой email или войдите в систему.'
			)
		}

		const password = command.password
			? Password.fromHashed(await hash(command.password))
			: null

		const user = User.create(
			v4(),
			email,
			password,
			command.displayName,
			command.picture || null,
			UserRole.REGULAR,
			command.isVerified,
			command.method
		)

		await this.userRepository.save(user)

		return user
	}
}
