import { EntityManager } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'
import { TokenEntity } from '@/modules/auth/infrastructure/persistence/entities/token.entity'

@Injectable()
export class TokenRepository implements TokenRepositoryInterface {
	public constructor(private readonly em: EntityManager) {}

	public async findByTokenAndType(
		token: string,
		type: TokenType
	): Promise<Token | null> {
		const entity = await this.em.findOne(TokenEntity, {
			token,
			type
		})

		if (!entity) {
			return null
		}

		return this.toDomain(entity)
	}

	public async findByEmailAndType(
		email: string,
		type: TokenType
	): Promise<Token | null> {
		const entity = await this.em.findOne(TokenEntity, {
			email,
			type
		})

		if (!entity) {
			return null
		}

		return this.toDomain(entity)
	}

	public findById(id: string): Promise<TokenEntity | null> {
		return this.em.findOne(TokenEntity, {
			id
		})
	}

	public async save(token: Token): Promise<void> {
		const entity = await this.findById(token.id)

		if (entity) {
			this.updateEntity(entity, token)
			await this.em.flush()
		} else {
			const newEntity = this.toEntity(token)
			this.em.persist(newEntity)
			await this.em.flush()
		}
	}

	public async delete(token: Token): Promise<void> {
		const entity = this.toEntity(token)

		await this.em.removeAndFlush(entity)
	}

	private toDomain(entity: TokenEntity): Token {
		return Token.restore(
			entity.id,
			entity.email,
			entity.token,
			entity.type,
			entity.expiresIn,
			entity.createdAt
		)
	}

	private toEntity(token: Token): TokenEntity {
		const entity = new TokenEntity()
		entity.id = token.id
		entity.email = token.getEmail()
		entity.token = token.getToken()
		entity.type = token.getType()
		entity.expiresIn = token.getExpiresIn()
		entity.createdAt = token.getCreatedAt()
		return entity
	}

	private updateEntity(entity: TokenEntity, token: Token): void {
		entity.email = token.getEmail()
		entity.token = token.getToken()
		entity.type = token.getType()
		entity.expiresIn = token.getExpiresIn()
	}
}
