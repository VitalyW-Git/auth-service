import { EntityManager } from '@mikro-orm/core'
import { Injectable, NotFoundException } from '@nestjs/common'
import { hash } from 'argon2'

import { AuthMethod, User } from '@/database/entities'

import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
	public constructor(private readonly em: EntityManager) {}

	public async findById(id: string): Promise<User> {
		const user = await this.em.findOne(
			User,
			{ id },
			{ populate: ['accounts'] }
		)

		if (!user) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенные данные.'
			)
		}

		return user
	}

	public async findByEmail(email: string): Promise<User | null> {
		return await this.em.findOne(
			User,
			{ email },
			{ populate: ['accounts'] }
		)
	}

	public async create(
		email: string,
		password: string,
		displayName: string,
		picture: string,
		method: AuthMethod,
		isVerified: boolean
	): Promise<User> {
		const user = this.em.create(User, {
			email,
			password: password ? await hash(password) : '',
			displayName,
			picture,
			method,
			isVerified
		})

		await this.em.persistAndFlush(user)

		return this.em.findOne(
			User,
			{ id: user.id },
			{ populate: ['accounts'] }
		)
	}

	public async update(userId: string, dto: UpdateUserDto): Promise<User> {
		const user = await this.findById(userId)

		user.email = dto.email
		user.displayName = dto.name
		user.isTwoFactorEnabled = dto.isTwoFactorEnabled

		await this.em.flush()

		return user
	}
}
