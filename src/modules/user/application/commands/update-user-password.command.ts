export class UpdateUserPasswordCommand {
	constructor(
		public readonly email: string,
		public readonly password: string
	) {}
}
