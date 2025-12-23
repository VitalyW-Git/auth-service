export interface UserInterface {
	id: string
	email: string | null
	name: string | null
	picture: string | null
	role: string
	isVerified: boolean
	isTwoFactorEnabled: boolean
	method: string
	createdAt: Date
	updatedAt: Date
	phone: string | null
	isPhoneVerified: boolean
}
