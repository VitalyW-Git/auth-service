import { Check, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'

@Entity({ tableName: 'tokens' })
// Код из SMS адресован только телефону, остальные токены — только email.
@Check({
	name: 'tokens_recipient_check',
	expression: `"type" = 'PHONE_VERIFICATION' and "phone" is not null and "email" is null or "type" <> 'PHONE_VERIFICATION' and "email" is not null and "phone" is null`
})
export class TokenEntity {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property({
		type: 'text',
		nullable: true,
		comment: 'Email the token was sent to; NULL for SMS codes'
	})
	email?: string

	@Property({
		length: 16,
		nullable: true,
		comment: 'Phone the SMS code was sent to, E.164; NULL for email tokens'
	})
	phone?: string

	@Property({ type: 'text', unique: true })
	tokenHash!: string

	@Enum(() => TokenType)
	type!: TokenType

	@Property({ fieldName: 'expires_in' })
	expiresIn!: Date

	@Property({
		default: 0,
		comment:
			'How many times a code was entered; incremented before the check'
	})
	attempts: number = 0

	@Property({ fieldName: 'created_at', defaultRaw: 'now()' })
	createdAt: Date = new Date()
}
