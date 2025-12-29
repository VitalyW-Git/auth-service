import { AggregateRoot } from '@nestjs/cqrs'

export class Account extends AggregateRoot {
	private constructor(
		public readonly id: string,
		private type: string,
		private provider: string,
		private refreshToken: string | null,
		private accessToken: string | null,
		private expiresAt: number,
		private userId: string | null,
		private createdAt: Date,
		private updatedAt: Date
	) {
		super()
	}

	public static create(
		id: string,
		type: string,
		provider: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number,
		userId: string
	): Account {
		const now = new Date()
		return new Account(
			id,
			type,
			provider,
			refreshToken,
			accessToken,
			expiresAt,
			userId,
			now,
			now
		)
	}

	public static restore(
		id: string,
		type: string,
		provider: string,
		refreshToken: string | null,
		accessToken: string | null,
		expiresAt: number,
		userId: string | null,
		createdAt: Date,
		updatedAt: Date
	): Account {
		return new Account(
			id,
			type,
			provider,
			refreshToken,
			accessToken,
			expiresAt,
			userId,
			createdAt,
			updatedAt
		)
	}

	public updateTokens(
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	): void {
		this.accessToken = accessToken
		this.refreshToken = refreshToken
		this.expiresAt = expiresAt
		this.updatedAt = new Date()
	}

	public updateAccessToken(accessToken: string, expiresAt: number): void {
		this.accessToken = accessToken
		this.expiresAt = expiresAt
		this.updatedAt = new Date()
	}

	public isTokenExpired(): boolean {
		const now = Math.floor(Date.now() / 1000)
		return this.expiresAt <= now
	}

	public getType(): string {
		return this.type
	}

	public getProvider(): string {
		return this.provider
	}

	public getRefreshToken(): string | null {
		return this.refreshToken
	}

	public getAccessToken(): string | null {
		return this.accessToken
	}

	public getExpiresAt(): number {
		return this.expiresAt
	}

	public getUserId(): string | null {
		return this.userId
	}

	public getCreatedAt(): Date {
		return this.createdAt
	}

	public getUpdatedAt(): Date {
		return this.updatedAt
	}
}
