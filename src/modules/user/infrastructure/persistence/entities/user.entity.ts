import {
	Collection,
	Entity,
	Enum,
	OneToMany,
	PrimaryKey,
	Property
} from '@mikro-orm/core'
import { v4 } from 'uuid'

import { AuthMethod, UserRole } from '@/database/enums'
import {AccountEntity} from "@/modules/auth/infrastructure/persistence/entities/account.entity";

@Entity({ tableName: 'users' })
export class UserEntity {
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

	@OneToMany(() => AccountEntity, account => account.user)
	accounts = new Collection<AccountEntity>(this)

	@Property({ fieldName: 'created_at' })
	createdAt: Date = new Date()

	@Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
	updatedAt: Date = new Date()
}

