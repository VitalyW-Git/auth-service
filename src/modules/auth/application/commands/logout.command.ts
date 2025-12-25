import {Request, Response} from "express";

export class LogoutCommand {

  public constructor(
    public readonly req: Request,
    public readonly res: Response,
  ) {}
}

