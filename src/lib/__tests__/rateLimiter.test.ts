import { skip } from "../rateLimiter"
import { Request } from "express"

describe("rateLimiter", () => {
  describe("concerning x-request-id", () => {
    it("does not skip a request if the header doesn’t exist", () => {
      const req: Partial<Request> = {
        headers: {},
        body: {},
      }
      expect(skip(req as Request)).toBeFalsy()
    })

    it("skips a request if it has the header", () => {
      const req: Partial<Request> = {
        headers: { "x-datadog-trace-id": "abcde-fghij-klmno-pqrst-uvwxy" },
        body: {},
      }
      expect(skip(req as Request)).toBeTruthy()
    })
  })
})
