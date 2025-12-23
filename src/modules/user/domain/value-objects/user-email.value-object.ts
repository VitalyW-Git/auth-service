export class UserEmail {
	private constructor(private readonly value: string) {
		if (!this.isValidEmail(value)) {
			throw new Error('Неверный адрес электронной почты')
		}
	}

	public static create(value: string): UserEmail {
		return new UserEmail(value)
	}

	private isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}

	public getValue(): string {
		return this.value
	}

	public equals(other: UserEmail): boolean {
		return this.value === other.value
	}
}
