import { UniqueConstraintViolationException } from '@mikro-orm/core'
import { ConflictException, Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { v4 } from 'uuid'

import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'
import { FindOrCreateUserByPhoneCommand } from '@/modules/user/application/commands/find-or-create-user-by-phone.command'
import { GetUserResult } from '@/modules/user/application/queries/get-user.query'
import { User } from '@/modules/user/domain/entities/user.entity'
import { UserRepositoryInterface } from '@/modules/user/domain/repository-interfaces/user.repository.interface'
import { Phone } from '@/modules/user/domain/value-objects/phone.value-object'

/**
 * Кто владеет номером после верного кода: аккаунт с этим подтверждённым номером — это вход в него;
 * номер указан, но не подтверждён в другом аккаунте — он уходит оттуда; иначе создаётся аккаунт PHONE.
 */
@CommandHandler(FindOrCreateUserByPhoneCommand)
export class FindOrCreateUserByPhoneHandler
	implements ICommandHandler<FindOrCreateUserByPhoneCommand>
{
	constructor(
		@Inject('UserRepositoryInterface')
		private readonly userRepository: UserRepositoryInterface
	) {}

	async execute(
		command: FindOrCreateUserByPhoneCommand
	): Promise<GetUserResult> {
		const phone = Phone.create(command.phone)
		const owner = await this.userRepository.findByPhone(phone.getValue())
		if (owner?.isPhoneVerified()) {
			return GetUserResult.fromUser(owner)
		}
		if (owner) {
			owner.releasePhone()
			await this.userRepository.save(owner)
		}
		return GetUserResult.fromUser(await this.createUser(phone))
	}

	// Два одновременных входа с новым номером: второй упрётся в users_phone_unique.
	private async createUser(phone: Phone): Promise<User> {
		const user = User.createByPhone(v4(), phone, AuthMethod.PHONE)
		try {
			await this.userRepository.save(user)
		} catch (error) {
			if (error instanceof UniqueConstraintViolationException) {
				throw new ConflictException(
					'Этот номер уже подтверждается в другом окне. Войдите ещё раз.'
				)
			}
			throw error
		}
		return user
	}
}
