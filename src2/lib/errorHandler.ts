import { Request, Response, NextFunction } from "express"
import { IpDeniedError } from "express-ipfilter"

const IP_DENIED_CODE = 401

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof IpDeniedError) {
    return res.status(IP_DENIED_CODE).end()
  }
  return next()
}
