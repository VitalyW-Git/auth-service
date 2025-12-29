import { EntityManager } from '@mikro-orm/core'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'

import { User } from '../../domain/entities/user.entity'
import { UserRepositoryInterface } from '../../domain/repository-interfaces/user.repository.interface'
import { Password } from '../../domain/value-objects/password.value-object'
import { UserEmail } from '../../domain/value-objects/user-email.value-object'
import { UserEntity } from '../persistence/entities/user.entity'

@Injectable()
export class UserRepository implements UserRepositoryInterface {
	constructor(
		@InjectRepository(UserEntity)
		private readonly ormRepo: EntityRepository<UserEntity>,
		private readonly em: EntityManager
	) {}

	async findById(id: string): Promise<User | null> {
		const entity = await this.ormRepo.findOne({ id })

		if (!entity) {
			return null
		}

		return this.toDomain(entity)
	}

	async findByEmail(email: string): Promise<User | null> {
		const entity = await this.ormRepo.findOne({ email })

		if (!entity) {
			return null
		}

		return this.toDomain(entity)
	}

	async save(user: User): Promise<void> {
		const entity = await this.ormRepo.findOne({ id: user.id })

		if (entity) {
			this.updateEntity(entity, user)
			await this.em.flush()
		} else {
			const newEntity = this.toEntity(user)
			this.em.persist(newEntity)
			await this.em.flush()
		}
	}

	private toDomain(entity: UserEntity): User {
		return User.restore(
			entity.id,
			UserEmail.create(entity.email),
			entity.password ? Password.fromHashed(entity.password) : null,
			entity.displayName,
			entity.picture ?? null,
			entity.role,
			entity.isVerified,
			entity.isTwoFactorEnabled,
			entity.method,
			entity.createdAt,
			entity.updatedAt
		)
	}

	private toEntity(user: User): UserEntity {
		const entity = new UserEntity()
		entity.id = user.id
		entity.email = user.getEmail().getValue()
		entity.password = user.getPassword()?.getHashedValue() || ''
		entity.displayName = user.getDisplayName()
		entity.picture = user.getPicture() ?? null
		entity.role = user.getRole()
		entity.isVerified = user.getIsVerified()
		entity.isTwoFactorEnabled = user.getIsTwoFactorEnabled()
		entity.method = user.getMethod() as any
		entity.createdAt = user.getCreatedAt()
		entity.updatedAt = user.getUpdatedAt()
		return entity
	}

	private updateEntity(entity: UserEntity, user: User): void {
		entity.email = user.getEmail().getValue()
		entity.password = user.getPassword()?.getHashedValue() || ''
		entity.displayName = user.getDisplayName()
		entity.picture = user.getPicture() ?? null
		entity.role = user.getRole()
		entity.isVerified = user.getIsVerified()
		entity.isTwoFactorEnabled = user.getIsTwoFactorEnabled()
		entity.method = user.getMethod() as any
		entity.updatedAt = user.getUpdatedAt()
	}
}
