import { Request } from 'express'

export class LoginCommand {
  public req: Request
	public constructor(
		public readonly email: string,
		public readonly password: string,
		public readonly code?: string
	) {}
}

