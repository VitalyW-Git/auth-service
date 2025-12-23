import { EntityManager } from '@mikro-orm/core'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'

import { User } from '../../domain/entities/user.entity'
import { UserRepositoryInterface } from '../../domain/repository-interfaces/user.repository.interface'
import { Password } from '../../domain/value-objects/password.value-object'
import { Phone } from '../../domain/value-objects/phone.value-object'
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

	async findByPhone(phone: string): Promise<User | null> {
		const entity = await this.ormRepo.findOne({ phone })

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
			entity.email ? UserEmail.create(entity.email) : null,
			entity.password ? Password.fromHashed(entity.password) : null,
			entity.name ?? null,
			entity.picture ?? null,
			entity.role,
			entity.isVerified,
			entity.isTwoFactorEnabled,
			entity.method,
			entity.createdAt,
			entity.updatedAt,
			entity.phone ? Phone.create(entity.phone) : null,
			entity.phoneVerifiedAt ?? null
		)
	}

	private toEntity(user: User): UserEntity {
		const entity = new UserEntity()
		entity.id = user.id
		entity.email = user.getEmail()?.getValue() ?? null
		entity.password = user.getPassword()?.getHashedValue() ?? null
		entity.name = user.getName()
		entity.picture = user.getPicture() ?? null
		entity.role = user.getRole()
		entity.isVerified = user.getIsVerified()
		entity.isTwoFactorEnabled = user.getIsTwoFactorEnabled()
		entity.method = user.getMethod() as any
		entity.createdAt = user.getCreatedAt()
		entity.updatedAt = user.getUpdatedAt()
		entity.phone = user.getPhone()?.getValue() ?? null
		entity.phoneVerifiedAt = user.getPhoneVerifiedAt()
		return entity
	}

	private updateEntity(entity: UserEntity, user: User): void {
		entity.email = user.getEmail()?.getValue() ?? null
		entity.password = user.getPassword()?.getHashedValue() ?? null
		entity.name = user.getName()
		entity.picture = user.getPicture() ?? null
		entity.role = user.getRole()
		entity.isVerified = user.getIsVerified()
		entity.isTwoFactorEnabled = user.getIsTwoFactorEnabled()
		entity.method = user.getMethod() as any
		entity.updatedAt = user.getUpdatedAt()
		entity.phone = user.getPhone()?.getValue() ?? null
		entity.phoneVerifiedAt = user.getPhoneVerifiedAt()
	}
}
