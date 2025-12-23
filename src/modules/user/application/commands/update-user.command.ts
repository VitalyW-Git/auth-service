export class UpdateUserCommand {
	constructor(
		public readonly userId: string,
		public readonly email: string,
		public readonly name: string,
		public readonly isTwoFactorEnabled: boolean
	) {}
}
