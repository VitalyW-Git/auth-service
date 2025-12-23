import { Request } from 'express'

export class ConfirmEmailCommand {
	constructor(
		public readonly token: string,
		public readonly req: Request
	) {}
}
