import { Injectable } from '@nestjs/common'
import { EntityManager } from '@mikro-orm/core'
import { IAccountRepository } from '@/modules/auth/domain/repository-interfaces/account.repository.interface'
import {User} from "@/modules/user/domain/entities/user.entity";
import {UserEntity} from "@/modules/user/infrastructure/persistence/entities/user.entity";
import {AccountEntity} from "@/modules/auth/infrastructure/persistence/entities/account.entity";

@Injectable()
export class AccountRepository implements IAccountRepository {
	public constructor(private readonly em: EntityManager) {}

	public async findByProviderId(
		providerId: string,
		provider: string
	): Promise<AccountEntity | null> {
		return this.em.findOne(AccountEntity, {
			id: providerId,
			provider
		})
	}

	public async create(
    user: User,
		provider: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	): Promise<AccountEntity> {
		const account = this.em.create(AccountEntity, {
      user: this.toEntity(user),
      type: 'oauth',
      provider,
      accessToken,
      refreshToken,
      expiresAt
		})

		await this.em.persistAndFlush(account)
		return account
	}

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity()
    entity.id = user.id
    entity.email = user.getEmail().getValue()
    entity.password = user.getPassword()?.getHashedValue() || ''
    entity.displayName = user.getDisplayName()
    entity.picture = user.getPicture() || undefined
    entity.role = user.getRole()
    entity.isVerified = user.getIsVerified()
    entity.isTwoFactorEnabled = user.getIsTwoFactorEnabled()
    entity.method = user.getMethod() as any
    entity.createdAt = user.getCreatedAt()
    entity.updatedAt = user.getUpdatedAt()
    return entity
  }
}

