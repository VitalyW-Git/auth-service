export class ValidateTwoFactorTokenCommand {
	constructor(
		public readonly email: string,
		public readonly code: string
	) {}
}

