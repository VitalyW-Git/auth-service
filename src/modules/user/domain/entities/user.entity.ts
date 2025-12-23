import { AggregateRoot } from '@nestjs/cqrs'

import { UserRole } from '@/modules/user/domain/common/enums/user-role.enum'
import { Password } from '@/modules/user/domain/value-objects/password.value-object'
import { Phone } from '@/modules/user/domain/value-objects/phone.value-object'
import { UserEmail } from '@/modules/user/domain/value-objects/user-email.value-object'

export class User extends AggregateRoot {
	private constructor(
		public readonly id: string,
		private email: UserEmail | null,
		private password: Password | null,
		private name: string | null,
		private picture: string | null,
		private role: UserRole,
		private isVerified: boolean,
		private isTwoFactorEnabled: boolean,
		private method: string,
		private createdAt: Date,
		private updatedAt: Date,
		private phone: Phone | null,
		private phoneVerifiedAt: Date | null
	) {
		super()
	}

	public static create(
		id: string,
		email: UserEmail,
		password: Password | null,
		name: string | null,
		picture: string | null,
		role: UserRole,
		isVerified: boolean,
		method: string
	): User {
		const now = new Date()
		return new User(
			id,
			email,
			password,
			name,
			picture,
			role,
			isVerified,
			false,
			method,
			now,
			now,
			null,
			null
		)
	}

	// Аккаунт по коду из SMS: телефон подтверждён самим кодом, email, пароля и имени нет (ADR 0011, 0012).
	public static createByPhone(
		id: string,
		phone: Phone,
		method: string
	): User {
		const now = new Date()
		return new User(
			id,
			null,
			null,
			null,
			null,
			UserRole.REGULAR,
			false,
			false,
			method,
			now,
			now,
			phone,
			now
		)
	}

	public static restore(
		id: string,
		email: UserEmail | null,
		password: Password | null,
		name: string | null,
		picture: string | null,
		role: UserRole,
		isVerified: boolean,
		isTwoFactorEnabled: boolean,
		method: string,
		createdAt: Date,
		updatedAt: Date,
		phone: Phone | null,
		phoneVerifiedAt: Date | null
	): User {
		return new User(
			id,
			email,
			password,
			name,
			picture,
			role,
			isVerified,
			isTwoFactorEnabled,
			method,
			createdAt,
			updatedAt,
			phone,
			phoneVerifiedAt
		)
	}

	public updateEmail(email: UserEmail): void {
		this.email = email
		this.updatedAt = new Date()
	}

	public updateName(name: string | null): void {
		this.name = name
		this.updatedAt = new Date()
	}

	public enableTwoFactor(): void {
		if (this.isTwoFactorEnabled) {
			throw new Error('Двухфакторная аутентификация включена')
		}
		this.isTwoFactorEnabled = true
		this.updatedAt = new Date()
	}

	public disableTwoFactor(): void {
		if (!this.isTwoFactorEnabled) {
			throw new Error('Двухфакторная аутентификация отключена')
		}
		this.isTwoFactorEnabled = false
		this.updatedAt = new Date()
	}

	// Неподтверждённый номер освобождается для того, кто подтвердил его кодом.
	public releasePhone(): void {
		if (this.isPhoneVerified()) {
			throw new Error(
				'Подтверждённый телефон нельзя передать другому аккаунту'
			)
		}
		this.phone = null
		this.updatedAt = new Date()
	}

	public updatePassword(password: Password): void {
		this.password = password
		this.updatedAt = new Date()
	}

	public verify(): void {
		if (this.isVerified) {
			throw new Error('Пользователь подтвержден')
		}
		this.isVerified = true
		this.updatedAt = new Date()
	}

	public getEmail(): UserEmail | null {
		return this.email
	}

	public getPassword(): Password | null {
		return this.password
	}

	public getName(): string | null {
		return this.name
	}

	public getPicture(): string | null {
		return this.picture
	}

	public getRole(): UserRole {
		return this.role
	}

	public getIsVerified(): boolean {
		return this.isVerified
	}

	public getIsTwoFactorEnabled(): boolean {
		return this.isTwoFactorEnabled
	}

	public getMethod(): string {
		return this.method
	}

	public getCreatedAt(): Date {
		return this.createdAt
	}

	public getUpdatedAt(): Date {
		return this.updatedAt
	}

	public getPhone(): Phone | null {
		return this.phone
	}

	public getPhoneVerifiedAt(): Date | null {
		return this.phoneVerifiedAt
	}

	public isPhoneVerified(): boolean {
		return this.phoneVerifiedAt !== null
	}
}
