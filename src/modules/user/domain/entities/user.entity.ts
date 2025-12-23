import { AggregateRoot } from '@nestjs/cqrs'
import { UserRole } from '@/database/enums'

import { UserEmail } from '../value-objects/user-email.value-object'
import { Password } from '../value-objects/password.value-object'

export class User extends AggregateRoot {

	private constructor(
		public readonly id: string,
		private email: UserEmail,
		private password: Password | null,
		private displayName: string,
		private picture: string | null,
		private role: UserRole,
		private isVerified: boolean,
		private isTwoFactorEnabled: boolean,
		private method: string,
		private createdAt: Date,
		private updatedAt: Date
	) {
		super()
	}

	public static create(
		id: string,
		email: UserEmail,
		password: Password | null,
		displayName: string,
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
			displayName,
			picture,
			role,
			isVerified,
			false,
			method,
			now,
			now
		)
	}

	public static restore(
		id: string,
		email: UserEmail,
		password: Password | null,
		displayName: string,
		picture: string | null,
		role: UserRole,
		isVerified: boolean,
		isTwoFactorEnabled: boolean,
		method: string,
		createdAt: Date,
		updatedAt: Date
	): User {
		return new User(
			id,
			email,
			password,
			displayName,
			picture,
			role,
			isVerified,
			isTwoFactorEnabled,
			method,
			createdAt,
			updatedAt
		)
	}

	public updateEmail(email: UserEmail): void {
		this.email = email
		this.updatedAt = new Date()
	}

	public updateDisplayName(displayName: string): void {
		this.displayName = displayName
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

	public getEmail(): UserEmail {
		return this.email
	}

	public getPassword(): Password | null {
		return this.password
	}

	public getDisplayName(): string {
		return this.displayName
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
}

