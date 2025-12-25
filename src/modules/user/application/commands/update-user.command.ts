export class UpdateUserCommand {
	constructor(
		public readonly userId: string,
		public readonly email: string,
		public readonly displayName: string,
		public readonly isTwoFactorEnabled: boolean
	) {}
}
