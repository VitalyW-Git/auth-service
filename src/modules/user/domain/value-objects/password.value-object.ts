export class Password {
	private constructor(private readonly hashedValue: string) {}

	public static create(plainPassword: string): Password {
		if (plainPassword.length < 6) {
			throw new Error('Пароль должен содержать не менее 6 символов.')
		}
		return new Password(plainPassword)
	}

	public static fromHashed(hashedValue: string): Password {
		return new Password(hashedValue)
	}

	public getHashedValue(): string {
		return this.hashedValue
	}

	public equals(other: Password): boolean {
		return this.hashedValue === other.hashedValue
	}
}
