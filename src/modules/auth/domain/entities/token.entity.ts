import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'

const MAX_ATTEMPTS = 5
// Повторно отправить SMS-код можно не раньше, чем через минуту: каждая SMS стоит денег.
const RESEND_DELAY_MS = 60 * 1000

/**
 * Хранит только хеш значения токена (см. TokenHasherInterface): само значение
 * уходит в письмо или SMS и нигде не сохраняется, поэтому утечка таблицы не даёт
 * действующих токенов. Получатель — email или телефон (код из SMS), не оба сразу.
 */
export class Token extends AggregateRoot {
	private constructor(
		public readonly id: string,
		private email: string | null,
		private phone: string | null,
		private tokenHash: string,
		private type: TokenType,
		private expiresIn: Date,
		private attempts: number,
		private createdAt: Date
	) {
		super()
	}

	public static create(
		email: string,
		tokenHash: string,
		type: TokenType,
		expiresIn: Date
	): Token {
		return new Token(
			uuidv4(),
			email,
			null,
			tokenHash,
			type,
			expiresIn,
			0,
			new Date()
		)
	}

	public static createForPhone(
		phone: string,
		tokenHash: string,
		type: TokenType,
		expiresIn: Date
	): Token {
		return new Token(
			uuidv4(),
			null,
			phone,
			tokenHash,
			type,
			expiresIn,
			0,
			new Date()
		)
	}

	// tokens.token_hash уникален, а код из SMS короткий: одинаковый код у разных номеров дал бы
	// одинаковый хеш. Поэтому хешируется пара «телефон + код» (ADR 0011).
	public static buildPhoneCodeHashInput(phone: string, code: string): string {
		return `${phone}:${code}`
	}

	public static restore(
		id: string,
		email: string | null,
		phone: string | null,
		tokenHash: string,
		type: TokenType,
		expiresIn: Date,
		attempts: number,
		createdAt: Date
	): Token {
		return new Token(
			id,
			email,
			phone,
			tokenHash,
			type,
			expiresIn,
			attempts,
			createdAt
		)
	}

	public isExpired(): boolean {
		return this.expiresIn < new Date()
	}

	public isValid(codeHash: string): boolean {
		return this.tokenHash === codeHash && !this.isExpired()
	}

	// Попытка засчитывается до сравнения кода, поэтому допустимы значения от 1 до MAX_ATTEMPTS.
	public isAttemptsExceeded(): boolean {
		return this.attempts > MAX_ATTEMPTS
	}

	public getRemainingAttempts(): number {
		return Math.max(MAX_ATTEMPTS - this.attempts, 0)
	}

	public canResend(): boolean {
		return Date.now() - this.createdAt.getTime() >= RESEND_DELAY_MS
	}

	public getSecondsUntilResend(): number {
		const elapsed = Date.now() - this.createdAt.getTime()
		return Math.max(Math.ceil((RESEND_DELAY_MS - elapsed) / 1000), 0)
	}

	public getEmail(): string | null {
		return this.email
	}

	public getPhone(): string | null {
		return this.phone
	}

	public getTokenHash(): string {
		return this.tokenHash
	}

	public getType(): TokenType {
		return this.type
	}

	public getExpiresIn(): Date {
		return this.expiresIn
	}

	public getAttempts(): number {
		return this.attempts
	}

	public getCreatedAt(): Date {
		return this.createdAt
	}
}
