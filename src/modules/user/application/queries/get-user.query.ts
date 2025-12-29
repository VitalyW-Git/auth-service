import { UserInterface } from '@/modules/user/application/common/interfaces/user.interface'

export class GetUserQuery {
	constructor(public readonly userId: string) {}
}

export class GetUserResult implements UserInterface {
	constructor(
		public readonly id: string,
		public readonly email: string,
		public readonly displayName: string,
		public readonly picture: string | null,
		public readonly role: string,
		public readonly isVerified: boolean,
		public readonly isTwoFactorEnabled: boolean,
		public readonly method: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date
	) {}
}
