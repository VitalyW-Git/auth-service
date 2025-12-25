import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {ConflictException, Inject} from '@nestjs/common'
import { v4 } from 'uuid'
import { hash } from 'argon2'

import { UserRole } from '@/database/enums'

import { User } from '../../../domain/entities/user.entity'
import { UserEmail } from '../../../domain/value-objects/user-email.value-object'
import { Password } from '../../../domain/value-objects/password.value-object'
import { IUserRepository } from '../../../domain/repository-interfaces/user.repository.interface'
import { CreateUserCommand } from '../create-user.command'
import {GetUserResult} from "@/modules/user/application/queries/get-user.query";
import {UserInterface} from "@/modules/user/application/common/interface/user.interface";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
	) {}

	async execute(command: CreateUserCommand): Promise<UserInterface> {
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

