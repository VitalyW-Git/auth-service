import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'

export class CreateUserCommand {
	constructor(
		public readonly email: string,
		public readonly password: string,
		public readonly name: string | null,
		public readonly picture: string,
		public readonly method: AuthMethod,
		public readonly isVerified: boolean
	) {}
}
