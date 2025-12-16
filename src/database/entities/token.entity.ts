import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'

import { TokenType } from '../enums'

@Entity({ tableName: 'tokens' })
export class Token {
	@PrimaryKey({ type: 'uuid' })
	id: string = v4()

	@Property()
	email!: string

	@Property({ unique: true })
	token!: string

	@Enum(() => TokenType)
	type!: TokenType

	@Property({ fieldName: 'expires_in' })
	expiresIn!: Date

	@Property({ fieldName: 'created_at' })
	createdAt: Date = new Date()
}
