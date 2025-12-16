import {
	Collection,
	Entity,
	Enum,
	OneToMany,
	PrimaryKey,
	Property
} from '@mikro-orm/core'
import { v4 } from 'uuid'

import { AuthMethod, UserRole } from '../enums'

import { Account } from './account.entity'

@Entity({ tableName: 'users' })
export class User {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property({ unique: true })
	email!: string

	@Property()
	password!: string

	@Property()
	displayName!: string

	@Property({ nullable: true })
	picture?: string

	@Enum(() => UserRole)
	role: UserRole = UserRole.REGULAR

	@Property({ fieldName: 'is_verified' })
	isVerified: boolean = false

	@Property({ fieldName: 'is_two_factor_enabled' })
	isTwoFactorEnabled: boolean = false

	@Enum(() => AuthMethod)
	method!: AuthMethod

	@OneToMany(() => Account, account => account.user)
	accounts = new Collection<Account>(this)

	@Property({ fieldName: 'created_at' })
	createdAt: Date = new Date()

	@Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
	updatedAt: Date = new Date()
}
