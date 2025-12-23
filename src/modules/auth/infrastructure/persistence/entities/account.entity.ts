import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'

import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

@Entity({ tableName: 'accounts' })
export class AccountEntity {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property({ type: 'text' })
	type!: string

	@Property({ type: 'text' })
	provider!: string

	@Property({
		fieldName: 'refresh_token',
		type: 'text',
		nullable: true
	})
	refreshToken?: string

	@Property({
		fieldName: 'access_token',
		type: 'text',
		nullable: true
	})
	accessToken?: string

	@Property({ fieldName: 'expires_at' })
	expiresAt!: number

	@Property({ fieldName: 'created_at', defaultRaw: 'now()' })
	createdAt: Date = new Date()

	@Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
	updatedAt: Date = new Date()

	@Index()
	@ManyToOne(() => UserEntity, {
		nullable: true,
		fieldName: 'user_id',
		deleteRule: 'set null'
	})
	user?: UserEntity

	@Property({ persist: false })
	get userId(): string | undefined {
		return this.user?.id
	}
}
