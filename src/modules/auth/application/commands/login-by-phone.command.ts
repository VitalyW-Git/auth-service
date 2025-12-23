import { Request } from 'express'

export class LoginByPhoneCommand {
	public constructor(
		public readonly phone: string,
		public readonly code: string,
		public readonly req: Request
	) {}
}
