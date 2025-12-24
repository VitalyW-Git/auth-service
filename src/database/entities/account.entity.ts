import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'

import {UserEntity} from "@/modules/user/infrastructure/persistence/entities/user.entity";

@Entity({ tableName: 'accounts' })
export class Account {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property()
	type!: string

	@Property()
	provider!: string

	@Property({ fieldName: 'refresh_token', nullable: true })
	refreshToken?: string

	@Property({ fieldName: 'access_token', nullable: true })
	accessToken?: string

	@Property({ fieldName: 'expires_at' })
	expiresAt!: number

	@Property({ fieldName: 'created_at' })
	createdAt: Date = new Date()

	@Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
	updatedAt: Date = new Date()

	@ManyToOne(() => UserEntity, { nullable: true, fieldName: 'user_id' })
	user?: UserEntity

	@Property({ persist: false })
	get userId(): string | undefined {
		return this.user?.id
	}
}
