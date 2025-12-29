import { EntityManager } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'

import { Account } from '@/modules/auth/domain/entities/account.entity'
import { AccountRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/account.repository.interface'
import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

@Injectable()
export class AccountRepository implements AccountRepositoryInterface {
	public constructor(private readonly em: EntityManager) {}

	public async findByProviderId(
		providerId: string,
		provider: string
	): Promise<Account | null> {
		const entity = await this.em.findOne(
			AccountEntity,
			{
				id: providerId,
				provider
			},
			{ populate: ['user'] }
		)

		if (!entity) {
			return null
		}

		return this.toDomain(entity)
	}

	public findById(id: string): Promise<AccountEntity | null> {
		return this.em.findOne(AccountEntity, {
			id
		})
	}

	public async save(
		account: Account,
		accountEntity: AccountEntity = null
	): Promise<void> {
		if (accountEntity) {
			this.updateEntity(accountEntity, account)
			await this.em.flush()
		} else {
			const newEntity = this.toEntity(account)
			this.em.persist(newEntity)
			await this.em.flush()
		}
	}

	private toDomain(entity: AccountEntity): Account {
		return Account.restore(
			entity.id,
			entity.type,
			entity.provider,
			entity.refreshToken ?? null,
			entity.accessToken ?? null,
			entity.expiresAt,
			entity.userId ?? null,
			entity.createdAt,
			entity.updatedAt
		)
	}

	private toEntity(account: Account): AccountEntity {
		const entity = new AccountEntity()
		entity.id = account.id
		entity.type = account.getType()
		entity.provider = account.getProvider()
		entity.refreshToken = account.getRefreshToken() ?? null
		entity.accessToken = account.getAccessToken() ?? null
		entity.expiresAt = account.getExpiresAt()
		entity.createdAt = account.getCreatedAt()
		entity.updatedAt = account.getUpdatedAt()

		if (account.getUserId()) {
			const userEntity = this.em.getReference(
				UserEntity,
				account.getUserId()!
			)
			entity.user = userEntity
		}

		return entity
	}

	private updateEntity(accountEntity: AccountEntity, account: Account): void {
		accountEntity.refreshToken = account.getRefreshToken() ?? null
		accountEntity.accessToken = account.getAccessToken() ?? null
		accountEntity.expiresAt = account.getExpiresAt()
		accountEntity.updatedAt = account.getUpdatedAt()

		if (
			account.getUserId() &&
			accountEntity.user?.id !== account.getUserId()
		) {
			const userEntity = this.em.getReference(
				UserEntity,
				account.getUserId()!
			)
			accountEntity.user = userEntity
		}
	}
}
