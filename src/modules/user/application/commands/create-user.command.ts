import {AuthMethod} from "@/modules/auth/application/common/enums/auth-method.enum";

export class CreateUserCommand {
	constructor(
		public readonly email: string,
		public readonly password: string,
		public readonly displayName: string,
		public readonly picture: string,
		public readonly method: AuthMethod,
		public readonly isVerified: boolean
	) {}
}
