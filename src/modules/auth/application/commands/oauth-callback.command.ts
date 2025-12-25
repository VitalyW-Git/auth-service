import {Request} from "express";

export class OAuthCallbackCommand {
  public req: Request
	public constructor(
		public readonly provider: string,
		public readonly code: string
	) {}
}

