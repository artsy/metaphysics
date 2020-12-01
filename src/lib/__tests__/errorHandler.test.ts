import { errorHandler } from "lib/errorHandler"
import { IpDeniedError } from "express-ipfilter"

describe("errorHandler", () => {
  const statusMock = jest.fn().mockReturnValueOnce({
    end: () => {
      // noop
    },
  })

  const res = { status: statusMock } as any

  it("returns a 401 for an IpDenied error", () => {
    errorHandler(
      new IpDeniedError("denied"),
      jest.fn() as any,
      res,
      jest.fn() as any
    )
    expect(statusMock).toBeCalledWith(401)
  })

  it("calls next otherwise", () => {
    const next = jest.fn()
    errorHandler(new Error("error"), jest.fn() as any, res, next)
    expect(next).toHaveBeenCalled()
  })
})
