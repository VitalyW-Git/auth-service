import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { User } from '@/modules/user/domain/entities/user.entity'

export class GetUserQuery {
	constructor(public readonly userId: string) {}
}

export class GetUserResult implements UserInterface {
	constructor(
		public readonly id: string,
		public readonly email: string | null,
		public readonly name: string | null,
		public readonly picture: string | null,
		public readonly role: string,
		public readonly isVerified: boolean,
		public readonly isTwoFactorEnabled: boolean,
		public readonly method: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly phone: string | null,
		public readonly isPhoneVerified: boolean
	) {}

	// Единственное место, где доменный User превращается в ответ API.
	public static fromUser(user: User): GetUserResult {
		return new GetUserResult(
			user.id,
			user.getEmail()?.getValue() ?? null,
			user.getName(),
			user.getPicture(),
			user.getRole(),
			user.getIsVerified(),
			user.getIsTwoFactorEnabled(),
			user.getMethod(),
			user.getCreatedAt(),
			user.getUpdatedAt(),
			user.getPhone()?.getValue() ?? null,
			user.isPhoneVerified()
		)
	}
}
