import {
	Check,
	Collection,
	Entity,
	Enum,
	OneToMany,
	PrimaryKey,
	Property
} from '@mikro-orm/core'
import { v4 } from 'uuid'

import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'
import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import { UserRole } from '@/modules/user/domain/common/enums/user-role.enum'

@Entity({ tableName: 'users' })
@Check({
	name: 'users_phone_verified_check',
	expression: `"phone_verified_at" is null or "phone" is not null`
})
@Check({
	name: 'users_contact_check',
	expression: `"email" is not null or "phone" is not null`
})
@Check({
	name: 'users_phone_method_check',
	expression: `"method" <> 'PHONE' or "phone_verified_at" is not null`
})
export class UserEntity {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property({
		type: 'text',
		nullable: true,
		unique: true,
		comment: 'Login email; NULL for accounts created by phone'
	})
	email?: string

	@Property({
		type: 'text',
		nullable: true,
		comment: 'Argon2 password hash; NULL for OAuth and phone accounts'
	})
	password?: string

	@Property({
		type: 'text',
		nullable: true,
		comment:
			'Name shown to staff and patients; NULL until the user provides it'
	})
	name?: string

	@Property({ type: 'text', nullable: true })
	picture?: string

	@Enum(() => UserRole)
	role: UserRole = UserRole.REGULAR

	@Property({ fieldName: 'is_verified' })
	isVerified: boolean = false

	@Property({ fieldName: 'is_two_factor_enabled' })
	isTwoFactorEnabled: boolean = false

	@Enum({
		items: () => AuthMethod,
		comment:
			'How the account was created: CREDENTIALS, GOOGLE, YANDEX or PHONE'
	})
	method!: AuthMethod

	@Property({
		length: 16,
		nullable: true,
		unique: true,
		comment:
			'Account phone in E.164 format, e.g. +79161234567; NULL until added'
	})
	phone?: string

	@Property({
		fieldName: 'phone_verified_at',
		nullable: true,
		comment:
			'Time the phone was confirmed by SMS code; NULL if not confirmed'
	})
	phoneVerifiedAt?: Date

	@OneToMany(() => AccountEntity, account => account.user)
	accounts = new Collection<AccountEntity>(this)

	@Property({ fieldName: 'created_at', defaultRaw: 'now()' })
	createdAt: Date = new Date()

	@Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
	updatedAt: Date = new Date()
}
