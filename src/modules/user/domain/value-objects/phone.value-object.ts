// Телефон в формате E.164 (+79161234567): только так уникальность users.phone и
// patients (clinic_id, phone) работает — один номер не может быть записан по-разному.
export class Phone {
	private constructor(private readonly value: string) {
		if (!this.isValidPhone(value)) {
			throw new Error('Неверный формат телефона')
		}
	}

	public static create(value: string): Phone {
		return new Phone(value)
	}

	private isValidPhone(phone: string): boolean {
		return /^\+[1-9]\d{7,14}$/.test(phone)
	}

	public getValue(): string {
		return this.value
	}

	public equals(other: Phone): boolean {
		return this.value === other.value
	}
}
