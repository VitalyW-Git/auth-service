import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'

import { TokenType } from '@/modules/auth/application/common/enums/token-type.enum'

export class Token extends AggregateRoot {
	private constructor(
		public readonly id: string,
		private email: string,
		private token: string,
		private type: TokenType,
		private expiresIn: Date,
		private createdAt: Date
	) {
		super()
	}

	public static create(
		email: string,
		token: string,
		type: TokenType,
		expiresIn: Date
	): Token {
		return new Token(uuidv4(), email, token, type, expiresIn, new Date())
	}

	public static restore(
		id: string,
		email: string,
		token: string,
		type: TokenType,
		expiresIn: Date,
		createdAt: Date
	): Token {
		return new Token(id, email, token, type, expiresIn, createdAt)
	}

	public isExpired(): boolean {
		return this.expiresIn < new Date()
	}

	public isValid(code: string): boolean {
		return this.token === code && !this.isExpired()
	}

	public getEmail(): string {
		return this.email
	}

	public getToken(): string {
		return this.token
	}

	public getType(): TokenType {
		return this.type
	}

	public getExpiresIn(): Date {
		return this.expiresIn
	}

	public getCreatedAt(): Date {
		return this.createdAt
	}
}
